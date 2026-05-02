const themeCSS = document.querySelector('link#theme-css');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle ? themeToggle.querySelector('.theme-toggle__icon') : null;

const ICONS = {
    light: '☀',
    dark: '☾'
};

function applyTheme(theme){
    if (theme === 'light'){
        themeCSS.href = 'styles/light.css';
        if (themeIcon) themeIcon.textContent = ICONS.light;
        themeToggle?.setAttribute('aria-label', 'Switch to dark theme');
    } else {
        themeCSS.href = '';
        if (themeIcon) themeIcon.textContent = ICONS.dark;
        themeToggle?.setAttribute('aria-label', 'Switch to light theme');
    }
}

const stored = localStorage.getItem('portfolio-theme');
applyTheme(stored === 'light' ? 'light' : 'dark');

themeToggle?.addEventListener('click', () => {
    const current = localStorage.getItem('portfolio-theme') === 'light' ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';

    if (next === 'light'){
        localStorage.setItem('portfolio-theme', 'light');
    } else {
        localStorage.removeItem('portfolio-theme');
    }

    applyTheme(next);
});
