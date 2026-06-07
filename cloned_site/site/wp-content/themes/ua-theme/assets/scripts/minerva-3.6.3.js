export function ua_handlePrimaryNav() {
  const navElement = document.getElementById('UA_PrimaryNav');
  const buttons = document.querySelectorAll('#UA_PrimaryNav button');
  const submenus = document.querySelectorAll('#UA_PrimaryNav button + ul');
  const parentItems = document.querySelectorAll('#UA_PrimaryNav li.ua_menu-item-parent');

  // Create method to collapse all sub menus
  const resetItems = () => {
    navElement.style.marginBottom = 0;
    parentItems.forEach((menu) => {
      menu.setAttribute('aria-expanded', 'false');
    });
    submenus.forEach((submenu) => {
      submenu.setAttribute('aria-hidden', 'true');
    });
  };

  if (navElement) {
    parentItems.forEach((menu) => {
      menu.setAttribute('aria-expanded', false);
      menu.setAttribute('aria-haspopup', true);
    });
    buttons.forEach((button) => {
      // Enable the buttons
      button.removeAttribute('hidden');
      // Add event listener for each button
      button.addEventListener('click', (event) => {
        let submenu = event.target.nextElementSibling;
        let parent = event.target.parentElement;

        // Handle opening submenu
        if (parent.getAttribute('aria-expanded') === 'true') {
          resetItems();
        } else {
          resetItems();
          submenu.setAttribute('aria-hidden', 'false');
          parent.setAttribute('aria-expanded', 'true');
        }
      });
    });

    // Handle closing the menus on focus out
    parentItems.forEach((parent) => {
      parent.addEventListener('focusout', (event) => {
        if (parent.getAttribute('aria-expanded') === 'true') {
          // Fix for :focus-within behavior
          if (parent.contains(event.relatedTarget)) {
            return;
          }
          resetItems();
        }
      });
    });

    // Handle closing the menu on 'esc'
    document.addEventListener('keyup', (event) => {
      if (event.key === 'Escape') {
        resetItems();
      }
    });
  }
}
export function ua_handleSecondaryNav() {
  const navElement = document.getElementById('UA_SecondaryNav');
  const buttons = document.querySelectorAll('#UA_SecondaryNav  button');
  const parentItems = document.querySelectorAll('#UA_SecondaryNav li[aria-haspopup]');

  if (navElement) {
    if (parentItems) {
      parentItems.forEach((parent) => {
        // Get the first active child of the parent
        const firstActiveChild = parent.querySelector('a[aria-current="true"]');
        // Collapse parent if it doesn't have an active child
        if (!firstActiveChild) {
          parent.setAttribute('aria-expanded', 'false');
        }
        // Collapse parent if the parent itself is active
        if (firstActiveChild && firstActiveChild.parentElement.parentElement === parent) {
          parent.setAttribute('aria-expanded', 'false');
        }

        // Get list of all nested menus
        const children = parent.querySelectorAll('ul[aria-hidden]');
        children.forEach((child) => {
          // Get first active child of the nested menu
          const isActive = child.querySelector('a[aria-current="true"]');
          // Hide the menu if it doesn't include an active item
          if (!isActive) {
            child.setAttribute('aria-hidden', true);
          }
        });
      });
    }

    buttons.forEach((button) => {
      // Enable the buttons
      button.removeAttribute('hidden');
      // Add event listener for each button
      button.addEventListener('click', (event) => {
        let submenu = event.target.parentElement.nextSibling;
        let parent = event.target.parentElement.parentElement;

        // Handle opening submenu
        if (parent.getAttribute('aria-expanded') === 'true') {
          submenu.setAttribute('aria-hidden', 'true');
          parent.setAttribute('aria-expanded', 'false');
        } else {
          submenu.setAttribute('aria-hidden', 'false');
          parent.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }
}
export function ua_handleTitleBar() {
  const titleBarElement = document.getElementById('UA_TitleBar');
  const searchElement = document.getElementById('UA_TitleSearch');
  const navElement = document.getElementById('UA_PrimaryNav');
  const expanderElement = {
    button: document.getElementById('UA_TitleBarExpander'),
    open: document.querySelectorAll('.ua_title-bar_expander_open')[0],
    closed: document.querySelectorAll('.ua_title-bar_expander_closed')[0],
  };

  // Create method to close title bar menu
  const closeMenu = () => {
    expanderElement.button.setAttribute('aria-expanded', 'false');
    if (navElement) {
      navElement.setAttribute('aria-hidden', 'true');
    }
    expanderElement.open.setAttribute('aria-hidden', 'true');
    expanderElement.closed.setAttribute('aria-hidden', 'false');
    searchElement.setAttribute('aria-hidden', 'true');
  };

  // Create method to open title bar menu
  const openMenu = () => {
    expanderElement.button.setAttribute('aria-expanded', 'true');
    if (navElement) {
      navElement.setAttribute('aria-hidden', 'false');
    }
    expanderElement.open.setAttribute('aria-hidden', 'false');
    expanderElement.closed.setAttribute('aria-hidden', 'true');
    searchElement.setAttribute('aria-hidden', 'false');
  };

  if (titleBarElement) {
    searchElement.setAttribute('aria-hidden', true);
    // Enable expander button
    expanderElement.button.removeAttribute('hidden');

    // Close Primary Navigation on inital load
    if (navElement) {
      navElement.setAttribute('aria-hidden', 'true');
    }

    // Set as expanded on larger viewports
    if (window.matchMedia('(min-width: 58rem)').matches) {
      openMenu();
    }
    window.addEventListener('resize', () => {
      if (window.matchMedia('(min-width: 58rem)').matches) {
        openMenu();
      }
    });

    // Handle opening the menu
    expanderElement.button.addEventListener('click', () => {
      if (expanderElement.button.getAttribute('aria-expanded') === 'true') {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Handle closing the sub menu when parent loses :focus-within
    // Only on smaller viewports
    titleBarElement.addEventListener('focusout', (event) => {
      if (
        !window.matchMedia('(min-width: 58em)').matches &&
        expanderElement.button.getAttribute('aria-expanded') === 'true'
      ) {
        if (titleBarElement.contains(event.relatedTarget)) {
          return;
        }
        closeMenu();
      }
    });

    // Handle closing the menu on 'esc'
    // Only on smaller viewports
    document.addEventListener('keyup', (event) => {
      if (!window.matchMedia('(min-width: 58em)').matches && event.key === 'Escape') {
        closeMenu();
      }
    });
  }
}
export function ua_handlePageSearch({ qualifier, selector = 'p, h2, li, td, th' }) {
  const container = document.querySelector(qualifier);
  const searchInput = document.querySelector('.ua_page-search_input');
  const resultsList = document.querySelector('.ua_page-search_results');

  if (!container || !searchInput || !resultsList) {
    return;
  }

  const elements = Array.from(container.querySelectorAll(selector));
  let currentIndex = -1;

  function clearHighlights() {
    elements.forEach((el) => {
      el.innerHTML = el.innerHTML.replace(/<mark>|<\/mark>/g, '');
    });
  }

  function highlightMatches(term) {
    clearHighlights();
    if (!term) {
      return;
    }
    const regex = new RegExp(`(${term})`, 'gi');
    elements.forEach((el) => {
      if (el.textContent.match(regex)) {
        el.innerHTML = el.textContent.replace(regex, '<mark>$1</mark>');
      }
    });
  }

  function buildResults(query) {
    resultsList.innerHTML = '';

    if (!query) {
      resultsList.setAttribute('aria-expanded', 'false');
      clearHighlights();
      return;
    }

    const matches = elements.filter((el) => el.textContent.toLowerCase().includes(query.toLowerCase()));

    if (matches.length === 0) {
      resultsList.innerHTML = `<li class="no-results" role="alert">No results found</li>`;
    } else {
      matches.forEach((el) => {
        const li = document.createElement('li');
        li.textContent = el.textContent.trim().slice(0, 60) + '...';
        li.setAttribute('tabindex', '-1');
        li.addEventListener('click', () => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          resultsList.setAttribute('aria-expanded', 'false');
        });
        resultsList.appendChild(li);
      });
    }

    resultsList.setAttribute('aria-expanded', 'true');
  }

  // Show results when focusing the input
  searchInput.addEventListener('focus', () => {
    const query = searchInput.value.trim();
    if (query !== '') {
      currentIndex = -1;
      highlightMatches(query);
      buildResults(query);
    }
  });

  // Optional: mobile/touch support
  searchInput.addEventListener('mousedown', () => {
    setTimeout(() => {
      const query = searchInput.value.trim();
      if (query !== '') {
        currentIndex = -1;
        highlightMatches(query);
        buildResults(query);
      }
    }, 0);
  });

  // Input changes trigger search
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    highlightMatches(query);
    buildResults(query);
  });

  // Hide results when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !resultsList.contains(e.target)) {
      resultsList.setAttribute('aria-expanded', 'false');
    }
  });

  // Hide results when tabbing away
  searchInput.addEventListener('blur', () => {
    setTimeout(() => {
      if (!resultsList.contains(document.activeElement)) {
        resultsList.setAttribute('aria-expanded', 'false');
      }
    }, 0);
  });

  // Keyboard navigation
  searchInput.addEventListener('keydown', (e) => {
    const items = Array.from(resultsList.querySelectorAll('li:not(.no-results)'));

    if (e.key === 'Escape') {
      resultsList.setAttribute('aria-expanded', 'false');
    }

    if (e.key === 'Tab') {
      resultsList.setAttribute('aria-expanded', 'false');
      return;
    }

    if (!items.length) {
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      currentIndex = (currentIndex + 1) % items.length;
      items.forEach((el, idx) => el.classList.toggle('active', idx === currentIndex));
      items[currentIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      currentIndex = (currentIndex - 1 + items.length) % items.length;
      items.forEach((el, idx) => el.classList.toggle('active', idx === currentIndex));
      items[currentIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (resultsList.getAttribute('aria-expanded') === 'true' && currentIndex >= 0) {
        items[currentIndex].click();
      } else {
        const query = searchInput.value.trim();
        if (query !== '') {
          currentIndex = -1;
          highlightMatches(query);
          buildResults(query);
          container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  });
}
