document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper to render participants list with collapsing behavior
  function renderParticipants(participants) {
    const maxVisible = 5;

    if (!participants.length) {
      return `<p class="no-participants">No participants yet</p>`;
    }

    const visible = participants.slice(0, maxVisible);
    const remainingParticipants = participants.slice(maxVisible);

    const visibleHTML = visible.map((p) => `<li>${p}</li>`).join("");

    if (!remainingParticipants.length) {
      return `<ul class="participant-list">${visibleHTML}</ul>`;
    }

    const hiddenHTML = remainingParticipants.map((p) => `<li>${p}</li>`).join("");
    const remainingCount = remainingParticipants.length;

    return `
      <ul class="participant-list">${visibleHTML}</ul>
      <ul class="participant-list extra-list collapsed">${hiddenHTML}</ul>
      <button class="toggle-participants" type="button" data-remaining="${remainingCount}">
        Show ${remainingCount} more
      </button>
    `;
  }

  // Handle expand/collapse clicks on participant overflow
  activitiesList.addEventListener("click", (event) => {
    const btn = event.target.closest(".toggle-participants");
    if (!btn) return;

    const section = btn.closest(".participants-section");
    if (!section) return;

    const extraList = section.querySelector(".extra-list");
    if (!extraList) return;

    const isCollapsed = extraList.classList.contains("collapsed");
    if (isCollapsed) {
      extraList.classList.remove("collapsed");
      extraList.classList.add("expanded");
      btn.textContent = `Show less`;
    } else {
      extraList.classList.remove("expanded");
      extraList.classList.add("collapsed");
      const remaining = btn.getAttribute("data-remaining") || "0";
      btn.textContent = `Show ${remaining} more`;
    }
  });

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsHtml = renderParticipants(details.participants);

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h5>Participants</h5>
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
