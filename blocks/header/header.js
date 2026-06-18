import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// -------------------- ACDL INIT --------------------
window.adobeDataLayer = window.adobeDataLayer || [];

function pushToDataLayer(payload) {
  window.adobeDataLayer.push({
    ...payload,
    timestamp: new Date().toISOString(),
  });
}
// ---------------------------------------------------

const isDesktop = window.matchMedia('(min-width: 900px)');

function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;

  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li')
    .forEach((section) => {
      section.setAttribute('aria-expanded', expanded);
    });
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';

  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

// MOVE THESE ABOVE toggleMenu
function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;

    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');

    if (navSectionExpanded && isDesktop.matches) {
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;

  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;

    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');

    if (navSectionExpanded && isDesktop.matches) {
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      toggleMenu(nav, navSections, false);
    }
  }
}

//  NOW SAFE
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null
    ? !forceExpanded
    : nav.getAttribute('aria-expanded') === 'true';

  const button = nav.querySelector('.nav-hamburger button');
  const newState = expanded ? 'closed' : 'open';

  pushToDataLayer({
    event: 'navToggle',
    navigation: {
      menuState: newState,
      device: isDesktop.matches ? 'desktop' : 'mobile',
    },
  });

  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';

  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');

  if (navSections) {
    const navDrops = navSections.querySelectorAll('.nav-drop');

    if (isDesktop.matches) {
      navDrops.forEach((drop) => {
        if (!drop.hasAttribute('tabindex')) {
          drop.setAttribute('tabindex', 0);
          drop.addEventListener('focus', focusNavSection);
        }
      });
    } else {
