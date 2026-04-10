// Handles user interactions, data processing, and API calls

/**
 * Initialize event listeners when the DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', function () {
	const addProcessBtn = document.getElementById('addProcessBtn');
	const generateTableBtn = document.getElementById('generateTableBtn');
	const runBtn = document.getElementById('runBtn');
	const algorithmSelect = document.getElementById('algorithm');
	
	// Initialize table based on process count input
	const processCountInput = document.getElementById('processCount');
	const initialCount = Number(processCountInput ? processCountInput.value : 1);
	generateProcessTable(Number.isFinite(initialCount) && initialCount > 0 ? initialCount : 1);
	toggleAlgorithmSpecificInputs();
	
	addProcessBtn.addEventListener('click', addProcessRow);
	generateTableBtn.addEventListener('click', handleGenerateTable);
	algorithmSelect.addEventListener('change', toggleAlgorithmSpecificInputs);
	runBtn.addEventListener('click', handleRunSimulation);
});

/**
 * Handle Generate Table button click
 */

function handleGenerateTable() {
	const processCountInput = document.getElementById('processCount');
	const processCount = Number(processCountInput ? processCountInput.value : NaN);

	if (!Number.isInteger(processCount) || processCount <= 0) {
		console.warn('Please enter a valid Number of Processes (positive integer).');
		return;
	}

	generateProcessTable(processCount);
}

/**
 * Toggle Priority column and Time Quantum input visibility based on selected algorithm
 */

function toggleAlgorithmSpecificInputs() {
	const algorithmSelect = document.getElementById('algorithm');
	const selectedAlgorithm = algorithmSelect ? algorithmSelect.value : '';
	const showPriority = selectedAlgorithm === 'Preemptive Priority';
	const showTimeQuantum = selectedAlgorithm === 'Round Robin';

	const priorityHeader = document.querySelector('.priorityColumnHeader');
	if (priorityHeader) {
		priorityHeader.style.display = showPriority ? 'table-cell' : 'none';
	}

	const priorityCells = document.querySelectorAll('.priorityColumnCell');
	priorityCells.forEach((cell) => {
		cell.style.display = showPriority ? 'table-cell' : 'none';
	});

	const timeQuantumGroup = document.getElementById('timeQuantumGroup');
	if (timeQuantumGroup) {
		timeQuantumGroup.style.display = showTimeQuantum ? 'flex' : 'none';
	}
}

/**
 * Create a process table row with auto-assigned process ID
 * @param {number} processNumber - Process sequence number (1-based)
 * @returns {HTMLTableRowElement} A process row element
 */
function createProcessRow(processNumber) {
	const processId = `P${processNumber}`;

	const newRow = document.createElement('tr');

	const processIdCell = document.createElement('td');
	const processIdInput = document.createElement('input');
	processIdInput.type = 'text';
	processIdInput.name = 'processId[]';
	processIdInput.value = processId;
	processIdInput.readOnly = true;
	processIdInput.setAttribute('aria-label', 'Process ID');
	processIdCell.appendChild(processIdInput);

	const arrivalTimeCell = document.createElement('td');
	const arrivalTimeInput = document.createElement('input');
	arrivalTimeInput.type = 'number';
	arrivalTimeInput.name = 'arrivalTime[]';
	arrivalTimeInput.placeholder = 'e.g. 0';
	arrivalTimeInput.setAttribute('aria-label', 'Arrival Time');
	arrivalTimeCell.appendChild(arrivalTimeInput);

	const burstTimeCell = document.createElement('td');
	const burstTimeInput = document.createElement('input');
	burstTimeInput.type = 'number';
	burstTimeInput.name = 'burstTime[]';
	burstTimeInput.placeholder = 'e.g. 5';
	burstTimeInput.setAttribute('aria-label', 'Burst Time');
	burstTimeCell.appendChild(burstTimeInput);

	const priorityCell = document.createElement('td');
	priorityCell.className = 'priorityColumnCell';
	const priorityInput = document.createElement('input');
	priorityInput.type = 'number';
	priorityInput.name = 'priority[]';
	priorityInput.placeholder = 'e.g. 1';
	priorityInput.setAttribute('aria-label', 'Priority');
	priorityCell.appendChild(priorityInput);

	newRow.appendChild(processIdCell);
	newRow.appendChild(arrivalTimeCell);
	newRow.appendChild(burstTimeCell);
	newRow.appendChild(priorityCell);

	return newRow;
}

/**
 * Regenerate process table body with exactly processCount rows
 * @param {number} processCount - Number of process rows to create
 */
function generateProcessTable(processCount) {
	const table = document.getElementById('processTable');
	const tbody = table.querySelector('tbody');
	tbody.innerHTML = '';

	for (let rowNumber = 1; rowNumber <= processCount; rowNumber += 1) {
		tbody.appendChild(createProcessRow(rowNumber));
	}

	toggleAlgorithmSpecificInputs();
}

/**
 * Add a new row to the process table with auto-assigned process ID
 * Keeps manual add as optional enhancement
 */
function addProcessRow() {
	const table = document.getElementById('processTable');
	const tbody = table.querySelector('tbody');
	const nextProcessNumber = tbody.rows.length + 1;
	tbody.appendChild(createProcessRow(nextProcessNumber));
	toggleAlgorithmSpecificInputs();
}

/**
 * Handle the Run Simulation button click
 * Sends process data to the Flask backend and renders the returned timeline
 */
async function handleRunSimulation() {
	const processData = extractProcessData();
	
	if (processData.length === 0) {
		console.warn('No valid processes to simulate. Please enter process data.');
		return;
	}
	
	const algorithmSelect = document.getElementById('algorithm');
	const selectedAlgorithm = algorithmSelect ? algorithmSelect.value : '';
	const payload = {
		processes: processData,
		algorithm: selectedAlgorithm,
	};

	if (selectedAlgorithm === 'Round Robin') {
		const timeQuantumInput = document.getElementById('timeQuantum');
		const timeQuantum = Number(timeQuantumInput ? timeQuantumInput.value : NaN);

		if (!Number.isFinite(timeQuantum) || timeQuantum <= 0) {
			console.warn('Please enter a valid positive Time Quantum for Round Robin.');
			return;
		}

		payload.quantum = timeQuantum;
	}

	try {
		const response = await fetch('/schedule', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || 'Failed to schedule processes.');
		}

		console.log('Scheduling Results:', data.results);
		console.log('Execution Timeline:', data.timeline);

		await renderGanttChart(data.timeline);
	} catch (error) {
		console.error('Simulation failed:', error);
		return;
	}
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
	const algorithmSelect = document.getElementById('algorithm');
	const selectedAlgorithm = algorithmSelect ? algorithmSelect.value : '';
	const requiresPriority = selectedAlgorithm === 'Preemptive Priority';
	
	rows.forEach((row) => {
		// Get all input elements in the row
		const inputs = row.querySelectorAll('input');
		
		// Extract values from input fields
		const id = inputs[0].value.trim();
		const arrivalStr = inputs[1].value.trim();
		const burstStr = inputs[2].value.trim();
		const priorityStr = inputs[3].value.trim();
		
		// Skip rows where required fields are empty
		if (!id || !arrivalStr || !burstStr) {
			return;
		}

		if (requiresPriority && !priorityStr) {
			return;
		}
		
		// Convert numeric strings to numbers
		const arrival = parseFloat(arrivalStr);
		const burst = parseFloat(burstStr);
		const priority = priorityStr ? parseFloat(priorityStr) : 0;
		
		// Validate numeric conversions
		if (isNaN(arrival) || isNaN(burst) || (requiresPriority && isNaN(priority))) {
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
