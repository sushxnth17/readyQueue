// Handles user interactions, data processing, and API calls

/**
 * Initialize event listeners when the DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', function () {
	const addProcessBtn = document.getElementById('addProcessBtn');
	const generateTableBtn = document.getElementById('generateTableBtn');
	const runBtn = document.getElementById('runBtn');
	const compareBtn = document.getElementById('compareBtn');
	const algorithmSelect = document.getElementById('algorithm');
	disableNumberInputScroll();
	
	// Initialize table based on process count input
	const processCountInput = document.getElementById('processCount');
	const initialCount = Number(processCountInput ? processCountInput.value : 1);
	generateProcessTable(Number.isFinite(initialCount) && initialCount > 0 ? initialCount : 1);
	toggleAlgorithmSpecificInputs();
	
	addProcessBtn.addEventListener('click', addProcessRow);
	generateTableBtn.addEventListener('click', handleGenerateTable);
	algorithmSelect.addEventListener('change', toggleAlgorithmSpecificInputs);
	runBtn.addEventListener('click', handleRunSimulation);
	compareBtn.addEventListener('click', handleCompareAllAlgorithms);
});

let numberInputScrollDisabled = false;

/**
 * Disable wheel-based value changes on number inputs while preserving typing and keyboard arrows.
 * Uses delegation so dynamically created inputs are automatically covered.
 */
function disableNumberInputScroll() {
	if (numberInputScrollDisabled) {
		return;
	}

	document.addEventListener('wheel', function (event) {
		const target = event.target;
		if (!(target instanceof HTMLInputElement) || target.type !== 'number') {
			return;
		}

		if (document.activeElement === target) {
			target.blur();
		}
	}, { passive: true });

	numberInputScrollDisabled = true;
}

/**
 * Safely read the current process table into structured process objects.
 * When strict is enabled, any missing or invalid required value stops the flow.
 * @param {Object} options
 * @param {boolean} options.strict - Whether to reject incomplete rows.
 * @returns {Array<{id: string, arrival: number, burst: number, priority: number|null}>}
 */
function extractProcessData(options = {}) {
	const strict = Boolean(options.strict);
	const table = document.getElementById('processTable');
	const tbody = table.querySelector('tbody');
	const rows = tbody.querySelectorAll('tr');
	const processData = [];

	rows.forEach((row, index) => {
		const inputs = row.querySelectorAll('input');
		const id = inputs[0] ? inputs[0].value.trim() : '';
		const arrivalStr = inputs[1] ? inputs[1].value.trim() : '';
		const burstStr = inputs[2] ? inputs[2].value.trim() : '';
		const priorityStr = inputs[3] ? inputs[3].value.trim() : '';

		if (!id && !arrivalStr && !burstStr && !priorityStr) {
			return;
		}

		if (!id || !arrivalStr || !burstStr) {
			if (strict) {
				throw new Error(`Row ${index + 1} must include Process ID, Arrival Time, and Burst Time.`);
			}
			return;
		}

		const arrival = Number(arrivalStr);
		const burst = Number(burstStr);
		const priority = priorityStr === '' ? null : Number(priorityStr);

		if (!Number.isFinite(arrival) || !Number.isFinite(burst) || (priorityStr !== '' && !Number.isFinite(priority))) {
			if (strict) {
				throw new Error(`Row ${index + 1} contains an invalid numeric value.`);
			}
			return;
		}

		processData.push({
			id,
			arrival,
			burst,
			priority,
		});
	});

	return processData;
}

function getPriorityInputForProcess(processId) {
	const table = document.getElementById('processTable');
	const tbody = table.querySelector('tbody');
	const rows = tbody.querySelectorAll('tr');

	for (const row of rows) {
		const inputs = row.querySelectorAll('input');
		if (inputs[0] && inputs[0].value.trim() === processId) {
			return inputs[3] || null;
		}
	}

	return null;
}

function updatePriorityInput(processId, value) {
	const priorityInput = getPriorityInputForProcess(processId);
	if (priorityInput) {
		priorityInput.value = String(value);
	}
}

function promptForPriorityValues(processData) {
	for (const process of processData) {
		if (process.priority !== null && process.priority !== undefined && process.priority !== '') {
			continue;
		}

		while (true) {
			const input = window.prompt(`Enter priority for ${process.id}:`, '');

			if (input === null) {
				return null;
			}

			const parsedPriority = Number(input.trim());
			if (!Number.isFinite(parsedPriority)) {
				window.alert('Please enter a valid numeric priority for every process.');
				continue;
			}

			process.priority = parsedPriority;
			updatePriorityInput(process.id, parsedPriority);
			break;
		}
	}

	return processData;
}

function resolveTimeQuantum() {
	const timeQuantumInput = document.getElementById('timeQuantum');
	const currentValue = timeQuantumInput ? timeQuantumInput.value.trim() : '';

	if (currentValue !== '') {
		const parsedValue = Number(currentValue);
		if (Number.isInteger(parsedValue) && parsedValue > 0) {
			return parsedValue;
		}
	}

	while (true) {
		const input = window.prompt('Enter a positive integer time quantum for Round Robin:', '');

		if (input === null) {
			return null;
		}

		const parsedQuantum = Number(input.trim());
		if (!Number.isInteger(parsedQuantum) || parsedQuantum <= 0) {
			window.alert('Please enter a valid positive integer time quantum.');
			continue;
		}

		if (timeQuantumInput) {
			timeQuantumInput.value = String(parsedQuantum);
		}
		return parsedQuantum;
	}
}

async function postScheduleRequest(url, payload) {
	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(payload)
	});

	const data = await response.json();
	if (!response.ok) {
		throw new Error(data.error || 'The scheduling request failed.');
	}

	return data;
}

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

	disableNumberInputScroll();
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
	disableNumberInputScroll();
	toggleAlgorithmSpecificInputs();
}

/**
 * Handle the Run Simulation button click
 * Sends process data to the Flask backend and renders the returned timeline
 */
async function handleRunSimulation() {
	let processData;

	try {
		processData = extractProcessData();
	} catch (error) {
		window.alert(error.message);
		return;
	}
	
	if (processData.length === 0) {
		window.alert('Please enter at least one valid process before running a simulation.');
		return;
	}
	
	const algorithmSelect = document.getElementById('algorithm');
	const selectedAlgorithm = algorithmSelect ? algorithmSelect.value : '';
	const payload = {
		processes: processData,
		algorithm: selectedAlgorithm,
	};

	if (selectedAlgorithm === 'Preemptive Priority') {
		const priorityReady = promptForPriorityValues(processData);
		if (!priorityReady) {
			return;
		}
	}

	if (selectedAlgorithm === 'Round Robin') {
		const timeQuantum = resolveTimeQuantum();
		if (timeQuantum === null) {
			return;
		}

		payload.quantum = timeQuantum;
	}

	try {
		const data = await postScheduleRequest('/schedule', payload);

		console.log('Scheduling Results:', data.results);
		console.log('Execution Timeline:', data.timeline);

		await renderGanttChart(data.timeline);
		renderResultsTable(data.results);
	} catch (error) {
		console.error('Simulation failed:', error);
		window.alert(error.message);
		return;
	}
}

/**
 * Compare all algorithms using the same process data and strict shared inputs.
 */
async function handleCompareAllAlgorithms() {
	let processData;

	try {
		processData = extractProcessData({ strict: true });
	} catch (error) {
		window.alert(error.message);
		return;
	}

	if (processData.length === 0) {
		window.alert('Please enter at least one process before comparing algorithms.');
		return;
	}

	const priorityReady = promptForPriorityValues(processData);
	if (!priorityReady) {
		return;
	}

	const timeQuantum = resolveTimeQuantum();
	if (timeQuantum === null) {
		return;
	}

	const ganttSection = document.getElementById('ganttSection');
	if (ganttSection) {
		ganttSection.style.display = 'none';
	}

	const ganttChart = document.getElementById('ganttChart');
	if (ganttChart) {
		ganttChart.innerHTML = '';
	}

	try {
		const data = await postScheduleRequest('/compare', {
			processes: processData,
			quantum: timeQuantum,
		});

		renderComparisonResults(data.comparison, data.bestAlgorithm);
	} catch (error) {
		console.error('Comparison failed:', error);
		window.alert(error.message);
	}
}

/**
 * Render the scheduling results table and average metrics.
 * @param {Array} results - Array of process result objects from the backend
 */
function renderResultsTable(results) {
	const resultsSection = document.getElementById('resultsSection');
	if (!resultsSection) {
		return;
	}

	resultsSection.innerHTML = '';
	resultsSection.style.display = 'block';

	const heading = document.createElement('h2');
	heading.id = 'results-heading';
	heading.textContent = 'Scheduling Results';
	resultsSection.appendChild(heading);

	if (!results || results.length === 0) {
		const emptyMessage = document.createElement('p');
		emptyMessage.textContent = 'No results available.';
		resultsSection.appendChild(emptyMessage);
		return;
	}

	const table = document.createElement('table');
	table.className = 'resultsTable';

	const thead = document.createElement('thead');
	const headerRow = document.createElement('tr');
	['Process ID', 'Arrival Time', 'Burst Time', 'Completion Time', 'Turnaround Time', 'Waiting Time'].forEach((columnName) => {
		const th = document.createElement('th');
		th.scope = 'col';
		th.textContent = columnName;
		headerRow.appendChild(th);
	});
	thead.appendChild(headerRow);
	table.appendChild(thead);

	const tbody = document.createElement('tbody');
	let totalTurnaroundTime = 0;
	let totalWaitingTime = 0;

	results.forEach((result) => {
		const row = document.createElement('tr');
		const cells = [
			result.id,
			result.arrival,
			result.burst,
			result.completionTime,
			result.turnaroundTime,
			result.waitingTime,
		];

		cells.forEach((value) => {
			const cell = document.createElement('td');
			cell.textContent = value;
			row.appendChild(cell);
		});

		totalTurnaroundTime += Number(result.turnaroundTime) || 0;
		totalWaitingTime += Number(result.waitingTime) || 0;
		tbody.appendChild(row);
	});

	table.appendChild(tbody);
	resultsSection.appendChild(table);

	const averageContainer = document.createElement('div');
	averageContainer.className = 'resultsAverages';

	const averageTurnaroundTime = totalTurnaroundTime / results.length;
	const averageWaitingTime = totalWaitingTime / results.length;

	averageContainer.innerHTML = `
		<div class="averageCard">
			<span class="averageLabel">Average Turnaround Time</span>
			<span class="averageValue">${averageTurnaroundTime.toFixed(2)}</span>
		</div>
		<div class="averageCard">
			<span class="averageLabel">Average Waiting Time</span>
			<span class="averageValue">${averageWaitingTime.toFixed(2)}</span>
		</div>
	`;

	resultsSection.appendChild(averageContainer);
}

/**
 * Render a compact algorithm comparison card with the best row highlighted.
 * @param {Array<{algorithm: string, averageTurnaroundTime: number, averageWaitingTime: number}>} comparison
 * @param {string} bestAlgorithm
 */
function renderComparisonResults(comparison, bestAlgorithm) {
	const resultsSection = document.getElementById('resultsSection');
	if (!resultsSection) {
		return;
	}

	resultsSection.innerHTML = '';
	resultsSection.style.display = 'block';

	const card = document.createElement('div');
	card.className = 'comparison-card';

	const heading = document.createElement('h2');
	heading.textContent = 'Algorithm Comparison';
	card.appendChild(heading);

	const bestEntry = comparison.find((entry) => entry.algorithm === bestAlgorithm) || null;
	const summary = document.createElement('div');
	summary.className = 'comparison-card__summary';
	summary.innerHTML = `
		<div><strong>Best Algorithm</strong><div>${bestEntry ? bestEntry.algorithm : 'N/A'}</div></div>
		<div><strong>Selection Rule</strong><div>Lowest Average Waiting Time</div></div>
	`;
	card.appendChild(summary);

	if (!comparison || comparison.length === 0) {
		const emptyMessage = document.createElement('p');
		emptyMessage.textContent = 'No comparison data available.';
		card.appendChild(emptyMessage);
		resultsSection.appendChild(card);
		return;
	}

	const table = document.createElement('table');
	table.className = 'comparisonTable';

	const thead = document.createElement('thead');
	const headerRow = document.createElement('tr');
	['Algorithm', 'Avg Turnaround Time', 'Avg Waiting Time', 'Best'].forEach((columnName) => {
		const th = document.createElement('th');
		th.scope = 'col';
		th.textContent = columnName;
		headerRow.appendChild(th);
	});
	thead.appendChild(headerRow);
	table.appendChild(thead);

	const tbody = document.createElement('tbody');

	comparison.forEach((result) => {
		const row = document.createElement('tr');
		if (result.algorithm === bestAlgorithm) {
			row.classList.add('best-row');
		}

		const cells = [
			result.algorithm,
			Number(result.averageTurnaroundTime || 0).toFixed(2),
			Number(result.averageWaitingTime || 0).toFixed(2),
			result.algorithm === bestAlgorithm ? 'Best' : '',
		];

		cells.forEach((value, cellIndex) => {
			const cell = document.createElement('td');
			if (cellIndex === 3 && value === 'Best') {
				const badge = document.createElement('span');
				badge.className = 'best-badge';
				badge.textContent = value;
				cell.appendChild(badge);
			} else {
				cell.textContent = value;
			}
			row.appendChild(cell);
		});

		tbody.appendChild(row);
	});

	table.appendChild(tbody);
	card.appendChild(table);
	resultsSection.appendChild(card);
}

/**
 * Render Gantt chart visualization with step-by-step animated execution
 * @param {Array} timeline - Array of timeline objects with id, start, end
 */
async function renderGanttChart(timeline) {
	const ganttChart = document.getElementById('ganttChart');
	const ganttSection = document.getElementById('ganttSection');

	ganttChart.innerHTML = '';

	if (!timeline || timeline.length === 0) {
		ganttChart.innerHTML = '<p>No timeline data available.</p>';
		return;
	}

	const SCALE = 50;
	const MS_PER_UNIT = 320;

	const timelineDiv = document.createElement('div');
	timelineDiv.className = 'ganttTimeline';

	const blocksContainer = document.createElement('div');
	blocksContainer.className = 'ganttBlocksContainer';

	const maxTime = Math.max(...timeline.map(t => t.end));
	const totalWidth = maxTime * SCALE;
	blocksContainer.style.width = totalWidth + 'px';

	ganttSection.style.display = 'block';
	ganttChart.appendChild(timelineDiv);
	timelineDiv.appendChild(blocksContainer);

	// ✅ CREATE ALL BLOCKS AT ONCE (CRITICAL FIX)
	timeline.forEach((segment, index) => {
		const block = document.createElement('div');

		const duration = segment.end - segment.start;
		const width = duration * SCALE;
		const left = segment.start * SCALE;

		block.className = `ganttBlock color-${index % 8}`;
		block.textContent = segment.id;

		block.style.position = 'absolute';
		block.style.left = left + 'px';
		block.style.width = '0px';

		block.setAttribute('data-start', segment.start);
		block.setAttribute('data-end', segment.end);

		blocksContainer.appendChild(block);

		// Animate width
		setTimeout(() => {
			block.style.width = width + 'px';
			block.style.transition = `width ${duration * MS_PER_UNIT}ms linear`;
		}, 50);
	});

	// Time scale (same as yours)
	const timeScale = document.createElement('div');
	timeScale.className = 'ganttTimeScale';
	timeScale.style.width = totalWidth + 'px';

	const timePoints = new Set();
	timeline.forEach(t => {
		timePoints.add(t.start);
		timePoints.add(t.end);
	});

	Array.from(timePoints).sort((a, b) => a - b).forEach(time => {
		const marker = document.createElement('div');
		marker.className = 'ganttTimeMarker';
		marker.textContent = time;
		marker.style.left = (time * SCALE) + 'px';
		timeScale.appendChild(marker);
	});

	timelineDiv.appendChild(timeScale);

	// Cursor animation stays same
	animateTimeCursor(timeline, {
		scale: SCALE,
		msPerUnit: MS_PER_UNIT
	});
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
