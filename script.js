const CONTACT_EMAIL = "";

const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector("#nav-links");

menuToggle.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isExpanded));
  menuToggle.setAttribute("aria-label", isExpanded ? "Open navigation" : "Close navigation");
  navLinks.classList.toggle("is-open", !isExpanded);
});

navLinks.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    navLinks.classList.remove("is-open");
  }
});

document.querySelector("#current-year").textContent = new Date().getFullYear();

const contactForm = document.querySelector("#contact-form");
const formHint = document.querySelector("#form-hint");
const contactNote = document.querySelector("#contact-note");

if (CONTACT_EMAIL) {
  const emailLink = document.createElement("a");
  emailLink.id = "contact-email-link";
  emailLink.className = "contact-email";
  emailLink.href = `mailto:${CONTACT_EMAIL}`;
  emailLink.textContent = CONTACT_EMAIL;
  contactNote.replaceChildren(document.createTextNode("Email: "), emailLink);
  formHint.textContent = "This opens your email app with your message ready to send.";
}

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!contactForm.reportValidity()) return;

  if (!CONTACT_EMAIL) {
    formHint.textContent = "The contact email is not configured yet. Add a verified address to CONTACT_EMAIL in script.js to enable this form.";
    return;
  }

  const formData = new FormData(contactForm);
  const name = formData.get("name").trim();
  const senderEmail = formData.get("email").trim();
  const message = formData.get("message").trim();
  const subject = encodeURIComponent(`Portfolio inquiry from ${name}`);
  const body = encodeURIComponent(`Hi Samkesh,\n\n${message}\n\nFrom: ${name} (${senderEmail})`);

  window.location.href = `mailto:${encodeURIComponent(CONTACT_EMAIL)}?subject=${subject}&body=${body}`;
});

const revealTargets = document.querySelectorAll(".project-card, .skill-card, .about-mark, .about-copy, .contact-copy, .contact-form");
if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealTargets.forEach((element) => {
    element.classList.add("reveal");
    revealObserver.observe(element);
  });
}
