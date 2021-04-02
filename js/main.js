const LANGS_SUPPORTED = [
  'de',
  'en',
  'es',
];

const LANGS_TRANSLATED = [
  'de',
  'en',
  'es',
];

function getLang() {
  const lang = window.localStorage.getItem('lang');
  if (LANGS_SUPPORTED.includes(lang)) {
    return lang;
  }
  return 'en';
}

function setLang(lang) {
  window.localStorage.setItem('lang', lang);
}

function homeRedirectLang() {
  const lang = getLang();
  window.location.pathname = `${window.location.pathname}/${lang}`;
}

function initNavbarBurgers() {
  const $navbarBurgers = Array.from(document.querySelectorAll('.navbar-burger'));
  $navbarBurgers.forEach(($navbarBurger) => {
    $navbarBurger.addEventListener('click', () => {
      const $target = document.getElementById($navbarBurger.dataset.target);
      $navbarBurger.classList.toggle('is-active');
      $target.classList.toggle('is-active');
    });
  });
}

function getPageLang() {
  for (let i = 0; i < LANGS_SUPPORTED.length; i++) {
    const lang = LANGS_SUPPORTED[i];
    const langPath = `/${lang}/`;
    if (window.location.pathname.indexOf(langPath) !== -1) {
      return lang;
    }
  }
  return null;
}

function setPageLang() {
  const lang = getPageLang();
  if (lang === null) {
    return;
  }
  if (!LANGS_TRANSLATED.includes(lang)) {
    openModalLangWarning();
  }
  setLang(lang);
}

function openModalLangWarning() {
  const $modalLangWarning = document.querySelector('#ijc_modal_lang_warning');
  $modalLangWarning.classList.add('is-active');
}

function closeModalLangWarning() {
  const $modalLangWarning = document.querySelector('#ijc_modal_lang_warning');
  $modalLangWarning.classList.remove('is-active');
}

document.addEventListener('DOMContentLoaded', () => {
  initNavbarBurgers();
  setPageLang();
});
