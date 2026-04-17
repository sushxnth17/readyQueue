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
	const processTable = document.getElementById('processTable');
	const timeQuantumInput = document.getElementById('timeQuantum');
	disableNumberInputScroll();
	ensureGlobalValidationMessage();
	
	// Initialize table based on process count input
	const processCountInput = document.getElementById('processCount');
	const initialCount = Number(processCountInput ? processCountInput.value : 1);
	generateProcessTable(Number.isFinite(initialCount) && initialCount > 0 ? initialCount : 1);
	toggleAlgorithmSpecificInputs();
	
	addProcessBtn.addEventListener('click', addProcessRow);
	generateTableBtn.addEventListener('click', handleGenerateTable);
	algorithmSelect.addEventListener('change', toggleAlgorithmSpecificInputs);
	if (processTable) {
		processTable.addEventListener('input', handleValidationInputChange);
	}
	if (timeQuantumInput) {
		timeQuantumInput.addEventListener('input', handleValidationInputChange);
	}
	runBtn.addEventListener('click', handleRunSimulation);
	compareBtn.addEventListener('click', handleCompareAllAlgorithms);
});

let numberInputScrollDisabled = false;
const MAX_PROCESS_INPUT_VALUE = 1000;
const LARGE_VALUE_ERROR_MESSAGE = 'Value too large. Please enter a value <= 1000';
const INTEGER_ONLY_ERROR_MESSAGE = 'Only integer values are allowed';

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

function ensureGlobalValidationMessage() {
	let banner = document.getElementById('globalValidationMessage');
	if (banner) {
		return banner;
	}

	const tableContainer = document.querySelector('.table-container');
	if (!tableContainer || !tableContainer.parentElement) {
		return null;
	}

	banner = document.createElement('div');
	banner.id = 'globalValidationMessage';
	banner.className = 'validation-banner';
	banner.textContent = 'Please fix the highlighted fields';
	banner.setAttribute('role', 'alert');
	banner.setAttribute('aria-live', 'polite');

	tableContainer.insertAdjacentElement('afterend', banner);
	return banner;
}

function showGlobalValidationMessage() {
	const banner = ensureGlobalValidationMessage();
	if (banner) {
		banner.classList.add('visible');
	}
}

function hideGlobalValidationMessage() {
	const banner = document.getElementById('globalValidationMessage');
	if (banner) {
		banner.classList.remove('visible');
	}
}

function clearInputError(input) {
	if (!(input instanceof HTMLInputElement)) {
		return;
	}

	input.classList.remove('input-invalid');
	input.removeAttribute('aria-invalid');

	const errorContainer = getErrorContainer(input);
	if (!errorContainer) {
		return;
	}

	const errorElement = errorContainer.querySelector('.field-error');
	if (errorElement) {
		errorElement.remove();
	}
}

function setInputError(input, message) {
	if (!(input instanceof HTMLInputElement)) {
		return;
	}

	clearInputError(input);
	input.classList.add('input-invalid');
	input.setAttribute('aria-invalid', 'true');

	const errorContainer = getErrorContainer(input);
	if (!errorContainer) {
		return;
	}

	const errorElement = document.createElement('small');
	errorElement.className = 'field-error';
	errorElement.textContent = message;
	errorContainer.appendChild(errorElement);
}

function getErrorContainer(input) {
	if (!(input instanceof HTMLInputElement)) {
		return null;
	}

	const tableCell = input.closest('td');
	if (tableCell) {
		return tableCell;
	}

	const wrapper = input.closest('.input-wrapper');
	if (wrapper) {
		return wrapper.parentElement || wrapper;
	}

	return input.parentElement;
}

function hasAnyInvalidInput() {
	return Boolean(document.querySelector('input.input-invalid'));
}

function clearAllInputErrors() {
	const invalidInputs = document.querySelectorAll('#processTable input.input-invalid');
	invalidInputs.forEach((input) => clearInputError(input));
	const timeQuantumInput = document.getElementById('timeQuantum');
	if (timeQuantumInput) {
		clearInputError(timeQuantumInput);
	}
	hideGlobalValidationMessage();
}

function isPriorityColumnVisible() {
	const algorithmSelect = document.getElementById('algorithm');
	return algorithmSelect ? algorithmSelect.value === 'Preemptive Priority' : false;
}

function validateProcessInputs() {
	const table = document.getElementById('processTable');
	if (!table) {
		return true;
	}

	clearAllInputErrors();

	const rows = table.querySelectorAll('tbody tr');
	const priorityVisible = isPriorityColumnVisible();
	let hasErrors = false;

	rows.forEach((row) => {
		const inputs = row.querySelectorAll('input');
		const processIdInput = inputs[0] || null;
		const arrivalInput = inputs[1] || null;
		const burstInput = inputs[2] || null;
		const priorityInput = inputs[3] || null;

		if (processIdInput) {
			const idValue = processIdInput.value.trim();
			if (!idValue) {
				hasErrors = true;
				setInputError(processIdInput, 'Process ID is required.');
			}
		}

		if (arrivalInput) {
			const arrivalValue = arrivalInput.value.trim();
			const arrivalNumber = Number(arrivalValue);
			if (arrivalValue === '' || !Number.isFinite(arrivalNumber) || arrivalNumber < 0) {
				hasErrors = true;
				setInputError(arrivalInput, 'Arrival time must be >= 0.');
			} else if (!Number.isInteger(arrivalNumber)) {
				hasErrors = true;
				setInputError(arrivalInput, INTEGER_ONLY_ERROR_MESSAGE);
			} else if (arrivalNumber > MAX_PROCESS_INPUT_VALUE) {
				hasErrors = true;
				setInputError(arrivalInput, LARGE_VALUE_ERROR_MESSAGE);
			}
		}

		if (burstInput) {
			const burstValue = burstInput.value.trim();
			const burstNumber = Number(burstValue);
			if (burstValue === '' || !Number.isFinite(burstNumber) || burstNumber <= 0) {
				hasErrors = true;
				setInputError(burstInput, 'Burst time must be > 0.');
			} else if (!Number.isInteger(burstNumber)) {
				hasErrors = true;
				setInputError(burstInput, INTEGER_ONLY_ERROR_MESSAGE);
			} else if (burstNumber > MAX_PROCESS_INPUT_VALUE) {
				hasErrors = true;
				setInputError(burstInput, LARGE_VALUE_ERROR_MESSAGE);
			}
		}

		if (priorityVisible && priorityInput) {
			const priorityValue = priorityInput.value.trim();
			const priorityNumber = Number(priorityValue);
			if (priorityValue === '' || !Number.isFinite(priorityNumber)) {
				hasErrors = true;
				setInputError(priorityInput, 'Priority must be a valid number.');
			} else if (!Number.isInteger(priorityNumber)) {
				hasErrors = true;
				setInputError(priorityInput, INTEGER_ONLY_ERROR_MESSAGE);
			}
		}
	});

	if (hasErrors) {
		showGlobalValidationMessage();
		return false;
	}

	hideGlobalValidationMessage();
	return true;
}

function handleValidationInputChange(event) {
	const target = event.target;
	if (!(target instanceof HTMLInputElement)) {
		return;
	}

	clearInputError(target);
	if (!hasAnyInvalidInput()) {
		hideGlobalValidationMessage();
	}
}

function validateTimeQuantumInput(options = {}) {
	const required = Boolean(options.required);
	const timeQuantumInput = document.getElementById('timeQuantum');
	if (!timeQuantumInput) {
		return !required;
	}

	clearInputError(timeQuantumInput);

	const value = timeQuantumInput.value.trim();
	if (value === '') {
		if (required) {
			setInputError(timeQuantumInput, 'Time quantum must be > 0.');
			showGlobalValidationMessage();
			return false;
		}
		return true;
	}

	const parsedValue = Number(value);
	if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
		setInputError(timeQuantumInput, 'Time quantum must be > 0.');
		showGlobalValidationMessage();
		return false;
	}

	if (!Number.isInteger(parsedValue)) {
		setInputError(timeQuantumInput, INTEGER_ONLY_ERROR_MESSAGE);
		showGlobalValidationMessage();
		return false;
	}

	if (!hasAnyInvalidInput()) {
		hideGlobalValidationMessage();
	}

	return true;
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

			if (!Number.isInteger(parsedPriority)) {
				window.alert(INTEGER_ONLY_ERROR_MESSAGE);
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

	if (!showPriority) {
		const priorityInputs = document.querySelectorAll('input[name="priority[]"]');
		priorityInputs.forEach((input) => clearInputError(input));
		if (!hasAnyInvalidInput()) {
			hideGlobalValidationMessage();
		}
	}

	if (!showTimeQuantum) {
		const timeQuantumInput = document.getElementById('timeQuantum');
		if (timeQuantumInput) {
			clearInputError(timeQuantumInput);
		}
		if (!hasAnyInvalidInput()) {
			hideGlobalValidationMessage();
		}
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
	arrivalTimeInput.min = '0';
	arrivalTimeInput.max = String(MAX_PROCESS_INPUT_VALUE);
	arrivalTimeInput.setAttribute('aria-label', 'Arrival Time');
	arrivalTimeCell.appendChild(arrivalTimeInput);

	const burstTimeCell = document.createElement('td');
	const burstTimeInput = document.createElement('input');
	burstTimeInput.type = 'number';
	burstTimeInput.name = 'burstTime[]';
	burstTimeInput.placeholder = 'e.g. 5';
	burstTimeInput.min = '1';
	burstTimeInput.max = String(MAX_PROCESS_INPUT_VALUE);
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

function setRunButtonLoadingState(isLoading) {
	const runButton = document.getElementById('runBtn');
	if (!runButton) {
		return;
	}

	if (!runButton.dataset.defaultLabel) {
		const existingLabel = runButton.querySelector('.btn-label');
		if (existingLabel && existingLabel.textContent.trim()) {
			runButton.dataset.defaultLabel = existingLabel.textContent.trim();
		} else {
			const labelFromText = Array.from(runButton.childNodes)
				.filter((node) => node.nodeType === Node.TEXT_NODE)
				.map((node) => node.textContent)
				.join(' ')
				.trim();
			runButton.dataset.defaultLabel = labelFromText || 'Run Simulation';
		}
	}

	let label = runButton.querySelector('.btn-label');
	if (!label) {
		label = document.createElement('span');
		label.className = 'btn-label';
		label.textContent = runButton.dataset.defaultLabel;
		runButton
			.querySelectorAll(':scope > .btn-label')
			.forEach((duplicateLabel) => duplicateLabel.remove());
		Array.from(runButton.childNodes).forEach((node) => {
			if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
				node.remove();
			}
		});
		runButton.appendChild(label);
	}

	let spinner = runButton.querySelector('.btn-spinner');
	if (!spinner) {
		spinner = document.createElement('span');
		spinner.className = 'btn-spinner';
		spinner.setAttribute('aria-hidden', 'true');
		runButton.insertBefore(spinner, label);
	}

	if (isLoading) {
		runButton.disabled = true;
		runButton.classList.add('is-loading');
		label.textContent = 'Running...';
		return;
	}

	runButton.disabled = false;
	runButton.classList.remove('is-loading');
	label.textContent = runButton.dataset.defaultLabel;
}

/**
 * Handle the Run Simulation button click
 * Sends process data to the Flask backend and renders the returned timeline
 */
async function handleRunSimulation() {
	setRunButtonLoadingState(true);

	try {
		if (!validateProcessInputs()) {
			return;
		}

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
			if (!validateTimeQuantumInput()) {
				return;
			}

			const timeQuantum = resolveTimeQuantum();
			if (timeQuantum === null) {
				return;
			}

			payload.quantum = timeQuantum;
		}

		const data = await postScheduleRequest('/schedule', payload);

		console.log('Scheduling Results:', data.results);
		console.log('Execution Timeline:', data.timeline);

		await renderGanttChart(data.timeline);
		renderResultsTable(data.results);
	} catch (error) {
		console.error('Simulation failed:', error);
		window.alert(error.message);
	} finally {
		setRunButtonLoadingState(false);
	}
}

/**
 * Compare all algorithms using the same process data and strict shared inputs.
 */
async function handleCompareAllAlgorithms() {
	if (!validateProcessInputs()) {
		return;
	}

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

	if (!validateTimeQuantumInput()) {
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
