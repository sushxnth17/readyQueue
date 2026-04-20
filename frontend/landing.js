document.addEventListener('DOMContentLoaded', function () {
	initializeLandingNavigation();
	initializeLandingRevealObserver();

	const startButton = document.getElementById('startSimulationBtn');
	if (startButton) {
		startButton.addEventListener('click', function () {
			window.location.href = 'simulator.html';
		});
	}
});

function initializeLandingNavigation() {
	const navContainer = document.querySelector('.section-nav');
	const navToggle = document.getElementById('sectionNavToggle');
	const navMenu = document.getElementById('sectionNavMenu');

	if (!navContainer || !navToggle || !navMenu) {
		return;
	}

	const setMenuOpen = function (isOpen) {
		navMenu.hidden = !isOpen;
		navToggle.setAttribute('aria-expanded', String(isOpen));
	};

	navToggle.addEventListener('click', function (event) {
		event.stopPropagation();
		setMenuOpen(navMenu.hidden);
	});

	navMenu.addEventListener('click', function (event) {
		const target = event.target;
		if (!(target instanceof HTMLElement)) {
			return;
		}

		const sectionButton = target.closest('[data-section-target], [data-section-href]');
		if (!(sectionButton instanceof HTMLElement)) {
			return;
		}

		const sectionHref = sectionButton.getAttribute('data-section-href');
		if (sectionHref) {
			window.location.href = sectionHref;
			setMenuOpen(false);
			return;
		}

		const sectionId = sectionButton.getAttribute('data-section-target');
		if (sectionId) {
			scrollToSection(sectionId);
		}
		setMenuOpen(false);
	});

	document.addEventListener('click', function (event) {
		const target = event.target;
		if (target instanceof Node && !navContainer.contains(target)) {
			setMenuOpen(false);
		}
	});

	document.addEventListener('keydown', function (event) {
		if (event.key === 'Escape') {
			setMenuOpen(false);
		}
	});

	setMenuOpen(false);
}

function scrollToSection(sectionId) {
	const targetSection = document.getElementById(sectionId);
	if (targetSection) {
		targetSection.scrollIntoView({ behavior: 'smooth' });
	}
}

function initializeLandingRevealObserver() {
	const sections = document.querySelectorAll('.reveal-section');
	if (!sections.length) {
		return;
	}

	if (!('IntersectionObserver' in window)) {
		sections.forEach((section) => section.classList.add('is-visible'));
		return;
	}

	const observer = new IntersectionObserver((entries, intersectionObserver) => {
		entries.forEach((entry) => {
			if (!entry.isIntersecting) {
				return;
			}

			entry.target.classList.add('is-visible');
			intersectionObserver.unobserve(entry.target);
		});
	}, {
		threshold: 0.2,
		rootMargin: '0px 0px -10% 0px',
	});

	sections.forEach((section) => observer.observe(section));
}
