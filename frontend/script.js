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
		
		// Render the Gantt chart
		renderGanttChart(result.timeline);
	} else {
		console.log(`${selectedAlgorithm} scheduling algorithm not implemented yet.`);
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
 * Render Gantt chart visualization in a single timeline row with animation
 * @param {Array} timeline - Array of timeline objects with id, start, end
 */
function renderGanttChart(timeline) {
	const ganttChart = document.getElementById('ganttChart');
	const ganttSection = document.getElementById('ganttSection');
	
	// Clear previous content
	ganttChart.innerHTML = '';
	
	if (!timeline || timeline.length === 0) {
		ganttChart.innerHTML = '<p>No timeline data available.</p>';
		return;
	}
	
	const SCALE = 50; // 50px per unit time
	const ANIMATION_DELAY = 400; // Delay between each block animation (ms)
	
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
	
	// Create blocks for each process in execution order
	timeline.forEach((processTimeline, index) => {
		const block = document.createElement('div');
		block.className = `ganttBlock color-${index % 8} animate pulse`;
		
		// Calculate width in pixels based on duration
		const duration = processTimeline.end - processTimeline.start;
		const blockWidth = duration * SCALE;
		
		// Set animation delay based on block index
		const animationDelay = index * (ANIMATION_DELAY / 1000); // Convert to seconds
		block.style.animationDelay = animationDelay + 's';
		
		block.style.width = blockWidth + 'px';
		block.textContent = processTimeline.id;
		block.title = `${processTimeline.id}: ${processTimeline.start} - ${processTimeline.end} (Duration: ${duration})`;
		block.setAttribute('data-start', processTimeline.start);
		block.setAttribute('data-end', processTimeline.end);
		
		blocksContainer.appendChild(block);
	});
	
	timelineDiv.appendChild(blocksContainer);
	
	// Create time scale with markers at block boundaries
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
	
	// Create markers at each time point with fade-in animation
	sortedTimes.forEach((time, index) => {
		const marker = document.createElement('div');
		marker.className = 'ganttTimeMarker';
		marker.textContent = time;
		marker.style.left = (time * SCALE) + 'px';
		
		// Stagger marker animation to match block animations
		const markerDelay = (timeline.length * (ANIMATION_DELAY / 1000)) + 0.2;
		marker.style.animation = `fadeIn 0.4s ease-in forwards ${markerDelay}s`;
		
		timeScale.appendChild(marker);
	});
	
	timelineDiv.appendChild(timeScale);
	ganttChart.appendChild(timelineDiv);
	
	// Show the gantt section
	ganttSection.style.display = 'block';
}