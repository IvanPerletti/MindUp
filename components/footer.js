class AppFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer class="controls">
        <a href="/pages/associations/associations.html?topic=climate" class="footer-link">
          Vai a Associations
        </a>
      </footer>
    `;
  }
}

customElements.define("app-footer", AppFooter);
