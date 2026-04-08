// Handles user interactions, data processing, and API calls

/**
 * Initialize event listeners when the DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', function () {
	const addProcessBtn = document.getElementById('addProcessBtn');
	const runBtn = document.getElementById('runBtn');
	
	// Initialize first process with P1
	initializeFirstProcess();
	
	addProcessBtn.addEventListener('click', addProcessRow);
	runBtn.addEventListener('click', handleRunSimulation);
});

/**
 * Initialize the first process row with P1 as process ID
 */
function initializeFirstProcess() {
	const table = document.getElementById('processTable');
	const firstRow = table.querySelector('tbody tr');
	
	if (firstRow) {
		const firstProcessIdInput = firstRow.querySelector('input[name="processId[]"]');
		if (firstProcessIdInput) {
			firstProcessIdInput.value = 'P1';
			firstProcessIdInput.readOnly = true;
		}
	}
}

/**
 * Add a new row to the process table with empty input fields
 * Process IDs are auto-assigned as P1, P2, P3, etc.
 */
function addProcessRow() {
	const table = document.getElementById('processTable');
	const tbody = table.querySelector('tbody');
	
	// Get the current row count to assign Process ID
	const rowCount = tbody.rows.length + 1;
	const processId = `P${rowCount}`;
	
	// Create a new table row
	const newRow = document.createElement('tr');
	
	// Create Process ID cell with non-editable input
	const processIdCell = document.createElement('td');
	const processIdInput = document.createElement('input');
	processIdInput.type = 'text';
	processIdInput.name = 'processId[]';
	processIdInput.value = processId;
	processIdInput.readOnly = true;
	processIdInput.setAttribute('aria-label', 'Process ID');
	processIdCell.appendChild(processIdInput);
	
	// Create Arrival Time cell
	const arrivalTimeCell = document.createElement('td');
	const arrivalTimeInput = document.createElement('input');
	arrivalTimeInput.type = 'number';
	arrivalTimeInput.name = 'arrivalTime[]';
	arrivalTimeInput.setAttribute('aria-label', 'Arrival Time');
	arrivalTimeCell.appendChild(arrivalTimeInput);
	
	// Create Burst Time cell
	const burstTimeCell = document.createElement('td');
	const burstTimeInput = document.createElement('input');
	burstTimeInput.type = 'number';
	burstTimeInput.name = 'burstTime[]';
	burstTimeInput.setAttribute('aria-label', 'Burst Time');
	burstTimeCell.appendChild(burstTimeInput);
	
	// Create Priority cell
	const priorityCell = document.createElement('td');
	const priorityInput = document.createElement('input');
	priorityInput.type = 'number';
	priorityInput.name = 'priority[]';
	priorityInput.setAttribute('aria-label', 'Priority');
	priorityCell.appendChild(priorityInput);
	
	// Append all cells to the row
	newRow.appendChild(processIdCell);
	newRow.appendChild(arrivalTimeCell);
	newRow.appendChild(burstTimeCell);
	newRow.appendChild(priorityCell);
	
	// Append the new row to the table body
	tbody.appendChild(newRow);
}

/**
 * Handle the Run Simulation button click
 * Extracts process data and logs it to the console
 */
function handleRunSimulation() {
	const processData = extractProcessData();
	
	if (processData.length === 0) {
		console.warn('No valid processes to simulate. Please enter process data.');
		return;
	}
	
	console.log('Process Data Extracted:', processData);
	
	// Get selected algorithm
	const algorithmSelect = document.getElementById('algorithm');
	const selectedAlgorithm = algorithmSelect.value;
	
	let result;
	
	// Perform scheduling based on selected algorithm
	if (selectedAlgorithm === 'FCFS') {
		result = fcfsScheduling(processData);
		console.log('FCFS Scheduling Results:', result.results);
		console.log('FCFS Execution Timeline:', result.timeline);
	} else if (selectedAlgorithm === 'SJF') {
		result = sjfScheduling(processData);
		console.log('SJF Scheduling Results:', result.results);
		console.log('SJF Execution Timeline:', result.timeline);
	} else if (selectedAlgorithm === 'SRTF') {
		result = srtfScheduling(processData);
		console.log('SRTF Scheduling Results:', result.results);
		console.log('SRTF Execution Timeline:', result.timeline);
	} else {
		console.log(`${selectedAlgorithm} scheduling algorithm not implemented yet.`);
		return;
	}
		
	// Render the Gantt chart
	renderGanttChart(result.timeline);
}

/**
 * Extract process data from the table
 * Returns an array of process objects with validated data
 */
function extractProcessData() {
	const table = document.getElementById('processTable');
	const tbody = table.querySelector('tbody');
	const rows = tbody.querySelectorAll('tr');
	const processData = [];
	
	rows.forEach((row) => {
		// Get all input elements in the row
		const inputs = row.querySelectorAll('input');
		
		// Extract values from input fields
		const id = inputs[0].value.trim();
		const arrivalStr = inputs[1].value.trim();
		const burstStr = inputs[2].value.trim();
		const priorityStr = inputs[3].value.trim();
		
		// Skip rows where critical fields are empty
		if (!id || !arrivalStr || !burstStr || !priorityStr) {
			return;
		}
		
		// Convert numeric strings to numbers
		const arrival = parseFloat(arrivalStr);
		const burst = parseFloat(burstStr);
		const priority = parseFloat(priorityStr);
		
		// Validate numeric conversions
		if (isNaN(arrival) || isNaN(burst) || isNaN(priority)) {
			console.warn(`Skipping invalid row: ${id}`);
			return;
		}
		
		// Create process object and add to array
		const process = {
			id: id,
			arrival: arrival,
			burst: burst,
			priority: priority
		};
		
		processData.push(process);
	});
	
	return processData;
}

/**
 * Perform FCFS (First Come First Serve) scheduling
 * @param {Array} processes - Array of process objects with id, arrival, burst
 * @returns {Object} Object with results array and timeline array
 */
function fcfsScheduling(processes) {
	// Create a copy of processes to avoid modifying original array
	const scheduledProcesses = JSON.parse(JSON.stringify(processes));
	
	// Sort processes by arrival time
	scheduledProcesses.sort((a, b) => a.arrival - b.arrival);
	
	let currentTime = 0;
	const timeline = [];
	
	// Calculate completion time, turnaround time, waiting time, and timeline
	scheduledProcesses.forEach((process) => {
		let startTime;
		
		// If CPU is idle before process arrives, move to arrival time
		if (currentTime < process.arrival) {
			currentTime = process.arrival;
			startTime = process.arrival;
		} else {
			startTime = currentTime;
		}
		
		// Add burst time to get completion time
		currentTime += process.burst;
		const endTime = currentTime;
		
		// Add timing data to process object
		process.startTime = startTime;
		process.completionTime = endTime;
		
		// TAT = CT - Arrival Time
		process.turnaroundTime = process.completionTime - process.arrival;
		
		// WT = TAT - Burst Time
		process.waitingTime = process.turnaroundTime - process.burst;
		
		// Add to timeline
		timeline.push({
			id: process.id,
			start: startTime,
			end: endTime
		});
	});
	
	// Return both results and timeline
	return {
		results: scheduledProcesses,
		timeline: timeline
	};
}

/**
 * Perform SJF (Shortest Job First) Non-Preemptive scheduling
 * @param {Array} processes - Array of process objects with id, arrival, burst
 * @returns {Object} Object with results array and timeline array
 */
function sjfScheduling(processes) {
	// Create a copy of processes to avoid modifying original array
	const pendingProcesses = JSON.parse(JSON.stringify(processes));

	// Sort by arrival to make ready-queue intake efficient
	pendingProcesses.sort((a, b) => a.arrival - b.arrival);

	let currentTime = 0;
	let nextArrivalIndex = 0;
	const readyQueue = [];
	const completedProcesses = [];
	const timeline = [];

	while (completedProcesses.length < pendingProcesses.length) {
		// Add all processes that have arrived by currentTime to the ready queue
		while (
			nextArrivalIndex < pendingProcesses.length &&
			pendingProcesses[nextArrivalIndex].arrival <= currentTime
		) {
			readyQueue.push(pendingProcesses[nextArrivalIndex]);
			nextArrivalIndex += 1;
		}

		// If no process is ready, CPU stays idle for 1 unit
		if (readyQueue.length === 0) {
			currentTime += 1;
			continue;
		}

		// Pick process with smallest burst time (stable tie-breaks for determinism)
		readyQueue.sort((a, b) => {
			if (a.burst !== b.burst) return a.burst - b.burst;
			if (a.arrival !== b.arrival) return a.arrival - b.arrival;
			return a.id.localeCompare(b.id);
		});

		const selectedProcess = readyQueue.shift();
		const startTime = currentTime;
		const endTime = currentTime + selectedProcess.burst;

		selectedProcess.startTime = startTime;
		selectedProcess.completionTime = endTime;
		selectedProcess.turnaroundTime = selectedProcess.completionTime - selectedProcess.arrival;
		selectedProcess.waitingTime = selectedProcess.turnaroundTime - selectedProcess.burst;

		timeline.push({
			id: selectedProcess.id,
			start: startTime,
			end: endTime
		});

		completedProcesses.push(selectedProcess);
		currentTime = endTime;
	}

	return {
		results: completedProcesses,
		timeline: timeline
	};
}

/**
 * Perform SRTF (Shortest Remaining Time First) Preemptive scheduling
 * @param {Array} processes - Array of process objects with id, arrival, burst
 * @returns {Object} Object with results array and timeline array
 */
function srtfScheduling(processes) {
	// Create a copy so original data remains unchanged
	const scheduledProcesses = JSON.parse(JSON.stringify(processes)).map((process) => ({
		...process,
		remainingTime: process.burst
	}));

	let currentTime = 0;
	let completedCount = 0;
	const timeline = [];

	while (completedCount < scheduledProcesses.length) {
		// Get all arrived and unfinished processes
		const availableProcesses = scheduledProcesses.filter(
			(process) => process.arrival <= currentTime && process.remainingTime > 0
		);

		// If no process is ready, CPU remains idle for one time unit
		if (availableProcesses.length === 0) {
			currentTime += 1;
			continue;
		}

		// Select process with shortest remaining time
		availableProcesses.sort((a, b) => {
			if (a.remainingTime !== b.remainingTime) return a.remainingTime - b.remainingTime;
			if (a.arrival !== b.arrival) return a.arrival - b.arrival;
			return a.id.localeCompare(b.id);
		});

		const selectedProcess = availableProcesses[0];
		const startTime = currentTime;
		const endTime = currentTime + 1;

		// Merge with previous segment if the same process continues execution
		const lastSegment = timeline[timeline.length - 1];
		if (lastSegment && lastSegment.id === selectedProcess.id && lastSegment.end === startTime) {
			lastSegment.end = endTime;
		} else {
			timeline.push({
				id: selectedProcess.id,
				start: startTime,
				end: endTime
			});
		}

		// Execute for one unit and advance time
		selectedProcess.remainingTime -= 1;
		currentTime += 1;

		// If process just finished, calculate completion metrics
		if (selectedProcess.remainingTime === 0) {
			selectedProcess.completionTime = currentTime;
			selectedProcess.turnaroundTime = selectedProcess.completionTime - selectedProcess.arrival;
			selectedProcess.waitingTime = selectedProcess.turnaroundTime - selectedProcess.burst;
			completedCount += 1;
		}
	}

	return {
		results: scheduledProcesses,
		timeline: timeline
	};
}

/**
 * Render Gantt chart visualization with step-by-step animated execution
 * @param {Array} timeline - Array of timeline objects with id, start, end
 */
async function renderGanttChart(timeline) {
	const ganttChart = document.getElementById('ganttChart');
	const ganttSection = document.getElementById('ganttSection');
	
	// Clear previous content
	ganttChart.innerHTML = '';
	
	if (!timeline || timeline.length === 0) {
		ganttChart.innerHTML = '<p>No timeline data available.</p>';
		return;
	}
	
	const SCALE = 50; // 50px per unit time
	const MS_PER_UNIT = 320; // Single source of truth for animation speed
	const MIN_SEGMENT_MS = 220; // Keeps tiny segments visible
	
	// Create timeline container
	const timelineDiv = document.createElement('div');
	timelineDiv.className = 'ganttTimeline';
	
	// Create blocks container
	const blocksContainer = document.createElement('div');
	blocksContainer.className = 'ganttBlocksContainer';
	
	// Find max time for time scale
	const maxTime = Math.max(...timeline.map(t => t.end));
	const totalWidth = maxTime * SCALE;
	blocksContainer.style.width = totalWidth + 'px';
	
	// Show the gantt section immediately
	ganttSection.style.display = 'block';
	ganttChart.appendChild(timelineDiv);
	timelineDiv.appendChild(blocksContainer);
	
	// Create time scale with markers (appears immediately)
	const timeScale = document.createElement('div');
	timeScale.className = 'ganttTimeScale';
	timeScale.style.width = totalWidth + 'px';
	
	// Collect all unique time points (block boundaries)
	const timePoints = new Set();
	timeline.forEach(t => {
		timePoints.add(t.start);
		timePoints.add(t.end);
	});
	const sortedTimes = Array.from(timePoints).sort((a, b) => a - b);
	
	// Create markers at each time point (visible from start)
	sortedTimes.forEach((time) => {
		const marker = document.createElement('div');
		marker.className = 'ganttTimeMarker';
		marker.textContent = time;
		marker.setAttribute('data-time', String(time));
		marker.style.left = (time * SCALE) + 'px';
		marker.style.opacity = '0.6';
		
		timeScale.appendChild(marker);
	});
	
	timelineDiv.appendChild(timeScale);
	
	// Start cursor animation immediately (in parallel with blocks)
	const cursorPromise = animateTimeCursor(timeline, {
		scale: SCALE,
		msPerUnit: MS_PER_UNIT
	});
	
	// Animate blocks one by one in sync with cursor
	for (let index = 0; index < timeline.length; index++) {
		const processTimeline = timeline[index];
		
		// Create block element
		const block = document.createElement('div');
		block.className = `ganttBlock color-${index % 8}`;
		
		// Calculate dimensions
		const duration = processTimeline.end - processTimeline.start;
		const blockWidth = duration * SCALE;
		
		// Use the same simulation clock as the cursor for perfect sync
		const animationDurationMs = Math.max(duration * MS_PER_UNIT, MIN_SEGMENT_MS);
		const animationDuration = animationDurationMs / 1000;
		
		// Set styles
		block.style.width = '0px'; // Start with 0 width
		block.style.minWidth = blockWidth + 'px';
		block.textContent = processTimeline.id;
		block.title = `${processTimeline.id}: Time ${processTimeline.start} - ${processTimeline.end} (Duration: ${duration} units)`;
		block.setAttribute('data-start', processTimeline.start);
		block.setAttribute('data-end', processTimeline.end);
		block.setAttribute('data-duration', duration);
		
		// Append block to container
		blocksContainer.appendChild(block);
		
		// Trigger animation after a frame to ensure CSS transitions apply
		await new Promise(resolve => requestAnimationFrame(resolve));
		
		// Apply animation
		block.classList.add('animate', 'pulse');
		block.style.setProperty('--animation-duration', animationDuration);
		block.style.animation = `ganttBlockGrow ${animationDuration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards, ganttBlockPulse 0.8s ease-out ${animationDuration}s`;
		block.style.width = blockWidth + 'px';
		block.style.transition = `width ${animationDuration}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
		
		// Wait for this block's animation to complete before adding next block
		await new Promise(resolve => setTimeout(resolve, animationDurationMs));
	}
	
	// Wait for cursor to finish
	await cursorPromise;
}

/**
 * Animate a moving time cursor through the Gantt chart
 * Works with all scheduling algorithms (FCFS, SJF, SRTF, etc.)
 * Synchronized with block animations for smooth visual experience
 * @param {Array} timeline - Array of timeline objects with id, start, end
 */
async function animateTimeCursor(timeline, options = {}) {
	if (!timeline || timeline.length === 0) return;
	
	const blocksContainer = document.querySelector('.ganttBlocksContainer');
	if (!blocksContainer) return;
	
	// Remove any existing cursor to reset properly
	const existingCursor = document.querySelector('.timeCursor');
	if (existingCursor) existingCursor.remove();
	
	// Configuration for smooth animation
	const SCALE = options.scale || 50;
	const MS_PER_UNIT = options.msPerUnit || 320;
	
	// Calculate total simulation time
	const totalTime = Math.max(...timeline.map(t => t.end));
	
	// Create and insert cursor element
	const cursor = document.createElement('div');
	cursor.className = 'timeCursor';
	cursor.setAttribute('data-time', '0');
	cursor.style.left = '0px';
	blocksContainer.appendChild(cursor);
	
	// Track cursor animation state
	let currentTime = 0;
	const animationStart = performance.now();
	
	return new Promise(resolve => {
		function animateFrame(timestamp) {
			const elapsed = timestamp - animationStart;
			
			// Convert elapsed wall time to simulated CPU time
			currentTime = elapsed / MS_PER_UNIT;
			
			// Stop when simulation time is reached
			if (currentTime >= totalTime) {
				currentTime = totalTime;
				updateCursorPosition(currentTime);
				highlightActiveBlock(currentTime);
				resolve();
				return;
			}
			
			// Update cursor visuals
			updateCursorPosition(currentTime);
			highlightActiveBlock(currentTime);
			
			// Continue animation
			requestAnimationFrame(animateFrame);
		}
		
		/**
		 * Update cursor position and time label
		 */
		function updateCursorPosition(time) {
			const pixelPosition = time * SCALE;
			cursor.style.left = pixelPosition + 'px';
			cursor.setAttribute('data-time', time.toFixed(1));

			// Visually show passed time points for easier reading
			const markers = Array.from(document.querySelectorAll('.ganttTimeMarker'));
			markers.forEach((marker) => {
				const markerTime = parseFloat(marker.getAttribute('data-time'));
				if (!isNaN(markerTime) && markerTime <= time + 0.01) {
					marker.classList.add('active');
				} else {
					marker.classList.remove('active');
				}
			});
		}
		
		/**
		 * Highlight the currently executing block
		 */
		function highlightActiveBlock(currentTime) {
			// Get fresh block references (they're added dynamically)
			const blocks = Array.from(blocksContainer.querySelectorAll('.ganttBlock'));
			blocks.forEach(block => block.classList.remove('active'));
			
			// Find the timeline segment executing at current time
			const activeSegment = timeline.find(segment =>
				currentTime >= segment.start && currentTime < segment.end
			);
			
			if (activeSegment) {
				// Find and highlight the matching block
				const activeBlock = blocks.find(block => {
					const blockStart = parseFloat(block.getAttribute('data-start'));
					const blockEnd = parseFloat(block.getAttribute('data-end'));
					const blockId = block.textContent.trim();
					
					return blockId === activeSegment.id &&
						   blockStart === activeSegment.start &&
						   blockEnd === activeSegment.end;
				});
				
				if (activeBlock) {
					activeBlock.classList.add('active');
				}
			}
		}
		
		// Start the animation loop
		requestAnimationFrame(animateFrame);
	});
}
