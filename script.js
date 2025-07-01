// --- Main App ---
document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "workoutCompanionData_v6";
  const DAYS_OF_WEEK = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const getDefaultData = () => ({
    streak: 0,
    lastWorkoutDate: null,
    streakFreeze: { count: 1, lastUsed: null, lastReset: null },
    exercises: [
      { id: 1, name: "Rest Day", desc: "Recovery is key." },
      { id: 2, name: "Full Body", desc: "Push-ups, Squats, Planks." },
    ],
    schedule: {
      Sunday: [1],
      Monday: [2],
      Tuesday: [1],
      Wednesday: [2],
      Thursday: [1],
      Friday: [2],
      Saturday: [1],
    },
    nextExerciseId: 3,
    history: [],
    settings: {
      userName: "",
      themeColor: "#fb923c", // orange-400
      notifications: {
        enabled: false,
        time: "08:00",
        permissionState: "default",
      },
    },
  });

  let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || getDefaultData();

  const dom = {
    pages: document.querySelectorAll(".page"),
    navButtons: document.querySelectorAll(".nav-btn"),
    streakDisplay: document.getElementById("streak-display"),
    streakMessage: document.getElementById("streak-message"),
    streakFreezeCount: document.getElementById("streak-freeze-count"),
    useFreezeBtn: document.getElementById("use-freeze-btn"),
    todaysExerciseList: document.getElementById("todays-exercise-list"),
    todayDaySpan: document.getElementById("today-day"),
    motivationalQuote: document.getElementById("motivational-quote"),
    todayHeader: document.getElementById("today-header"),
    scheduleContainer: document.getElementById("schedule-container"),
    customExerciseList: document.getElementById("custom-exercise-list"),
    addNewWorkoutBtn: document.getElementById("add-new-workout-btn"),
    historyList: document.getElementById("history-list"),
    heatmapContainer: document.getElementById("heatmap-container"),
    distributionChartContainer: document.getElementById(
      "distribution-chart-container"
    ),
    workoutModal: document.getElementById("workout-modal"),
    modalTitle: document.getElementById("modal-title"),
    workoutForm: document.getElementById("workout-form"),
    workoutIdInput: document.getElementById("workout-id"),
    workoutNameInput: document.getElementById("workout-name"),
    workoutDescInput: document.getElementById("workout-desc"),
    modalCancelBtn: document.getElementById("modal-cancel-btn"),
    scheduleModal: document.getElementById("schedule-modal"),
    scheduleModalTitle: document.getElementById("schedule-modal-title"),
    scheduleModalList: document.getElementById("schedule-modal-list"),
    scheduleModalCancelBtn: document.getElementById(
      "schedule-modal-cancel-btn"
    ),
    scheduleModalSaveBtn: document.getElementById("schedule-modal-save-btn"),
    userNameInput: document.getElementById("user-name"),
    themeColorInput: document.getElementById("theme-color-input"),
    enableNotificationsBtn: document.getElementById("enable-notifications-btn"),
    notificationTimeInput: document.getElementById("notification-time"),
    exportDataBtn: document.getElementById("export-data-btn"),
    importDataBtn: document.getElementById("import-data-btn"),
    importFileInput: document.getElementById("import-file-input"),
    resetAppBtn: document.getElementById("reset-app-btn"),
  };
  const myConfetti = confetti.create(
    document.getElementById("confetti-canvas"),
    { resize: true }
  );

  const setupPWA = () => {
    const createIcon = (s, t, b) => {
      const c = document.createElement("canvas");
      c.width = s;
      c.height = s;
      const x = c.getContext("2d");
      x.fillStyle = b;
      x.fillRect(0, 0, s, s);
      x.font = `${s * 0.6}px Inter,sans-serif`;
      x.fillStyle = "white";
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.fillText(t, s / 2, s / 2 + s * 0.05);
      return c.toDataURL();
    };
    const i192 = createIcon(192, "W", data.settings.themeColor),
      i512 = createIcon(512, "W", data.settings.themeColor);
    const m = {
      name: "Workout Companion",
      short_name: "Workout",
      start_url: ".",
      display: "standalone",
      background_color: "#111827",
      theme_color: "#111827",
      description: "A workout tracking app.",
      icons: [
        { src: i192, sizes: "192x192", type: "image/png" },
        { src: i512, sizes: "512x512", type: "image/png" },
      ],
    };
    document.getElementById("manifest-link").href = URL.createObjectURL(
      new Blob([JSON.stringify(m)], { type: "application/json" })
    );
    // We link the apple-touch-icon in the HTML now, but you could still set it dynamically if you wanted
    // document.getElementById('apple-touch-icon-link').href = i192;
  };

  const saveData = () =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  const getTodayStr = () => new Date().toISOString().split("T")[0];
  const isSameDay = (d1, d2) =>
    new Date(d1).toISOString().split("T")[0] ===
    new Date(d2).toISOString().split("T")[0];

  const renderAll = () => {
    renderTheme();
    renderStreakAndFreeze();
    renderTodaysWorkout();
    renderSchedule();
    renderCustomExercises();
    renderHistory();
    renderHeatmap();
    renderDistributionChart();
    renderSettings();
  };

  const saveAndRerender = () => {
    saveData();
    renderAll();
  };

  const switchPage = (pageId) => {
    dom.pages.forEach((p) =>
      p.classList.toggle("active", p.id === `page-${pageId}`)
    );
    dom.navButtons.forEach((b) =>
      b.classList.toggle("active", b.dataset.page === pageId)
    );
  };

  const renderTheme = () => {
    document.documentElement.style.setProperty(
      "--theme-color",
      data.settings.themeColor
    );
  };

  const renderStreakAndFreeze = () => {
    dom.streakDisplay.textContent = data.streak;
    dom.streakMessage.textContent =
      data.streak > 0
        ? `You're on fire!`
        : data.settings.userName
        ? `Let's get started, ${data.settings.userName}!`
        : `Let's get started!`;
    dom.streakFreezeCount.textContent = data.streakFreeze.count;
    const today = new Date();
    const completedTodayIds = data.history
      .filter((h) => isSameDay(h.date, today))
      .map((h) => h.id);
    const scheduledTodayIds = data.schedule[DAYS_OF_WEEK[today.getDay()]];
    const allDone = scheduledTodayIds.every(
      (id) => completedTodayIds.includes(id) || id === 1
    );
    const freezeUsed = data.streakFreeze.lastUsed === getTodayStr();
    dom.useFreezeBtn.disabled =
      data.streakFreeze.count <= 0 ||
      allDone ||
      freezeUsed ||
      completedTodayIds.length > 0;
    dom.useFreezeBtn.textContent = freezeUsed ? "Used" : "Use";
  };

  const renderTodaysWorkout = () => {
    const today = new Date();
    const dayOfWeek = DAYS_OF_WEEK[today.getDay()];
    dom.todayDaySpan.textContent = dayOfWeek;
    const scheduledIds = data.schedule[dayOfWeek] || [];
    const completedTodayIds = data.history
      .filter((h) => isSameDay(h.date, today))
      .map((h) => h.id);
    dom.todaysExerciseList.innerHTML = "";

    if (
      scheduledIds.length === 0 ||
      (scheduledIds.length === 1 && scheduledIds[0] === 1)
    ) {
      const workout = data.exercises.find((e) => e.id === 1);
      dom.todaysExerciseList.innerHTML = `<div class="p-4 rounded-lg text-center bg-gray-700"><p class="font-bold text-lg">${
        workout.name
      }</p><p class="text-gray-400 text-sm mt-1">${
        workout.desc || "No description."
      }</p></div>`;
      return;
    }

    scheduledIds
      .filter((id) => id !== 1)
      .forEach((id) => {
        const workout = data.exercises.find((e) => e.id === id);
        if (!workout) return;
        const isCompleted = completedTodayIds.includes(id);
        const el = document.createElement("div");
        el.className = `p-3 rounded-lg flex items-center justify-between transition-all ${
          isCompleted ? "bg-green-800/50" : "bg-gray-700"
        }`;
        el.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-5 h-5 flex items-center justify-center rounded-full ${
                      isCompleted ? "bg-green-500" : "border-2 border-gray-500"
                    }">
                        ${
                          isCompleted
                            ? '<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>'
                            : ""
                        }
                    </div>
                    <div>
                        <p class="font-semibold">${workout.name}</p>
                        <p class="text-xs text-gray-400">${
                          workout.desc || "No description."
                        }</p>
                    </div>
                </div>
                <button data-id="${id}" class="log-workout-btn text-xs px-3 py-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed" ${
          isCompleted ? "disabled" : ""
        } style="background-color: ${isCompleted ? "" : "var(--theme-color)"};">
                    ${isCompleted ? "Done" : "Log"}
                </button>`;
        dom.todaysExerciseList.appendChild(el);
      });
  };

  const renderSchedule = () => {
    dom.scheduleContainer.innerHTML = "";
    DAYS_OF_WEEK.forEach((day) => {
      const scheduledIds = data.schedule[day] || [];
      const workoutNames = scheduledIds
        .map((id) => data.exercises.find((e) => e.id === id)?.name || "")
        .filter(Boolean)
        .join(", ");
      const el = document.createElement("div");
      el.className = "bg-gray-700 p-3 rounded-lg";
      el.innerHTML = `
                <div class="flex justify-between items-center">
                    <p class="font-bold">${day}</p>
                    <button data-day="${day}" class="edit-schedule-btn text-xs bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-full">Edit</button>
                </div>
                <p class="text-xs text-gray-400 mt-2 truncate">${
                  workoutNames || "Rest Day"
                }</p>`;
      dom.scheduleContainer.appendChild(el);
    });
  };

  const renderSettings = () => {
    dom.userNameInput.value = data.settings.userName;
    dom.themeColorInput.value = data.settings.themeColor;
    dom.notificationTimeInput.value = data.settings.notifications.time;

    const perm = data.settings.notifications.permissionState;
    const btn = dom.enableNotificationsBtn;
    if (perm === "granted") {
      btn.textContent = "Notifications Enabled";
      btn.disabled = true;
      btn.classList.replace("bg-blue-500", "bg-green-600");
      btn.classList.remove("hover:bg-blue-600");
    } else if (perm === "denied") {
      btn.textContent = "Permission Denied";
      btn.disabled = true;
      btn.classList.replace("bg-blue-500", "bg-red-600");
      btn.classList.remove("hover:bg-blue-600");
    } else {
      btn.textContent = "Enable Notifications";
      btn.disabled = false;
      btn.classList.remove("bg-green-600", "bg-red-600");
      btn.classList.add("bg-blue-500", "hover:bg-blue-600");
    }
  };

  const renderCustomExercises = () => {
    dom.customExerciseList.innerHTML = "";
    data.exercises
      .filter((ex) => ex.id !== 1)
      .forEach((ex) => {
        const el = document.createElement("div");
        el.className =
          "bg-gray-700 p-3 rounded-lg flex items-center justify-between";
        el.innerHTML = `<div><p class="font-semibold">${
          ex.name
        }</p><p class="text-gray-400 text-xs">${
          ex.desc ? ex.desc.substring(0, 30) + "..." : "No description"
        }</p></div><div class="flex gap-2"><button data-id="${
          ex.id
        }" class="edit-workout-btn text-blue-400 hover:text-blue-300">Edit</button><button data-id="${
          ex.id
        }" class="delete-workout-btn text-red-500 hover:text-red-400">&times;</button></div>`;
        dom.customExerciseList.appendChild(el);
      });
  };
  const renderHistory = () => {
    dom.historyList.innerHTML = "";
    if (!data.history.length) {
      dom.historyList.innerHTML = `<p class="text-gray-500 text-center p-4">Your history is empty.</p>`;
      return;
    }
    [...data.history].reverse().forEach((item) => {
      const el = document.createElement("div");
      el.className =
        "bg-gray-700/50 p-3 rounded-lg flex justify-between items-center";
      el.innerHTML = `<span class="font-semibold">${
        item.name
      }</span><span class="text-gray-400 text-sm">${new Date(
        item.date
      ).toLocaleDateString()}</span>`;
      dom.historyList.appendChild(el);
    });
  };
  const renderHeatmap = () => {
    dom.heatmapContainer.innerHTML = "";
    const workoutDates = new Set(
      data.history.map((h) => new Date(h.date).toISOString().split("T")[0])
    );
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    oneYearAgo.setDate(oneYearAgo.getDate() - oneYearAgo.getDay());
    let grid = '<div class="flex flex-col gap-1">';
    for (let i = 0; i < 7; i++) {
      grid += '<div class="flex gap-1">';
      for (let j = 0; j < 53; j++) {
        const currentDay = new Date(oneYearAgo);
        currentDay.setDate(oneYearAgo.getDate() + j * 7 + i);
        if (currentDay > today) {
          grid += `<div class="heatmap-cell opacity-20"></div>`;
        } else {
          const dateStr = currentDay.toISOString().split("T")[0];
          const level = workoutDates.has(dateStr) ? "3" : "0";
          grid += `<div class="heatmap-cell" data-level="${level}" title="${dateStr}"></div>`;
        }
      }
      grid += "</div>";
    }
    grid += "</div>";
    dom.heatmapContainer.innerHTML = grid;
  };
  const renderDistributionChart = () => {
    dom.distributionChartContainer.innerHTML = "";
    const counts = data.history.reduce((acc, curr) => {
      acc[curr.name] = (acc[curr.name] || 0) + 1;
      return acc;
    }, {});
    if (Object.keys(counts).length === 0) {
      dom.distributionChartContainer.innerHTML = `<p class="text-gray-500 text-center p-4">No data to show yet.</p>`;
      return;
    }
    const maxCount = Math.max(...Object.values(counts));
    let chartHTML = '<div class="space-y-2">';
    for (const name in counts) {
      const percentage = maxCount > 0 ? (counts[name] / maxCount) * 100 : 0;
      chartHTML += `<div class="text-sm"><p class="font-semibold">${name} <span class="float-right text-gray-400">${counts[name]}</span></p><div class="w-full bg-gray-700 rounded-full h-2.5 mt-1"><div class="h-2.5 rounded-full" style="width: ${percentage}%; background-color: var(--theme-color);"></div></div></div>`;
    }
    chartHTML += "</div>";
    dom.distributionChartContainer.innerHTML = chartHTML;
  };

  const openWorkoutModal = (workoutId = null) => {
    dom.workoutForm.reset();
    if (workoutId) {
      const w = data.exercises.find((e) => e.id === workoutId);
      dom.modalTitle.textContent = "Edit Workout";
      dom.workoutIdInput.value = w.id;
      dom.workoutNameInput.value = w.name;
      dom.workoutDescInput.value = w.desc || "";
    } else {
      dom.modalTitle.textContent = "Add New Workout";
      dom.workoutIdInput.value = "";
    }
    dom.workoutModal.classList.remove("hidden");
  };
  const closeWorkoutModal = () => dom.workoutModal.classList.add("hidden");
  const handleSaveWorkout = (e) => {
    e.preventDefault();
    const id = parseInt(dom.workoutIdInput.value),
      n = dom.workoutNameInput.value.trim(),
      d = dom.workoutDescInput.value.trim();
    if (!n) return;
    if (id) {
      const i = data.exercises.findIndex((x) => x.id === id);
      data.exercises[i] = { ...data.exercises[i], name: n, desc: d };
    } else {
      data.exercises.push({ id: data.nextExerciseId++, name: n, desc: d });
    }
    closeWorkoutModal();
    saveAndRerender();
  };

  const openScheduleModal = (day) => {
    dom.scheduleModalTitle.textContent = `Edit ${day} Schedule`;
    dom.scheduleModalList.innerHTML = "";
    const scheduledIds = data.schedule[day] || [];
    data.exercises
      .filter((e) => e.id !== 1)
      .forEach((ex) => {
        const isChecked = scheduledIds.includes(ex.id);
        const li = document.createElement("label");
        li.className = "flex items-center gap-3 p-2 bg-gray-700 rounded-lg";
        li.innerHTML = `<input type="checkbox" data-id="${
          ex.id
        }" class="w-5 h-5 rounded bg-gray-900 border-gray-600 focus:ring-orange-600" ${
          isChecked ? "checked" : ""
        } style="color: var(--theme-color); --tw-ring-color: var(--theme-color);"><span>${
          ex.name
        }</span>`;
        dom.scheduleModalList.appendChild(li);
      });
    dom.scheduleModalSaveBtn.dataset.day = day;
    dom.scheduleModal.classList.remove("hidden");
  };
  const closeScheduleModal = () => dom.scheduleModal.classList.add("hidden");
  const handleSaveSchedule = (e) => {
    const day = e.target.dataset.day;
    const checkedIds = Array.from(
      dom.scheduleModalList.querySelectorAll("input:checked")
    ).map((cb) => parseInt(cb.dataset.id));
    if (checkedIds.length === 0) {
      data.schedule[day] = [1];
    } else {
      data.schedule[day] = checkedIds;
    }
    closeScheduleModal();
    saveAndRerender();
  };

  const checkAndResetStreak = () => {
    if (!data.lastWorkoutDate) return;
    const today = new Date(),
      lastWorkout = new Date(data.lastWorkoutDate);
    if (isSameDay(today, lastWorkout)) return;
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (
      !isSameDay(lastWorkout, yesterday) &&
      data.streakFreeze.lastUsed !== yesterday.toISOString().split("T")[0]
    ) {
      data.streak = 0;
    }
    saveData();
  };
  const checkAndResetFreeze = () => {
    const today = new Date(),
      lastReset = data.streakFreeze.lastReset
        ? new Date(data.streakFreeze.lastReset)
        : null;
    if (today.getDay() === 1 && (!lastReset || !isSameDay(today, lastReset))) {
      data.streakFreeze.count = 1;
      data.streakFreeze.lastReset = getTodayStr();
      saveData();
    }
  };

  const handleNotificationPermission = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      alert("Push Notifications are not supported in your browser.");
      return;
    }
    const permission = await Notification.requestPermission();
    data.settings.notifications.permissionState = permission;
    if (permission === "granted") {
      data.settings.notifications.enabled = true;
      scheduleDailyNotification();
    } else {
      data.settings.notifications.enabled = false;
    }
    saveAndRerender();
  };

  const scheduleDailyNotification = async () => {
    if (
      !data.settings.notifications.enabled ||
      data.settings.notifications.permissionState !== "granted"
    )
      return;

    const registration = await navigator.serviceWorker.ready;
    const notifications = await registration.getNotifications({
      tag: "workout-reminder",
    });
    notifications.forEach((n) => n.close());

    const [hours, minutes] = data.settings.notifications.time.split(":");
    const now = new Date();
    let notificationTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes
    );

    if (notificationTime < now) {
      notificationTime.setDate(notificationTime.getDate() + 1);
    }

    const dayOfWeek = DAYS_OF_WEEK[notificationTime.getDay()];
    const scheduledIds = data.schedule[dayOfWeek] || [];
    const workoutNames = scheduledIds
      .map((id) => data.exercises.find((e) => e.id === id)?.name)
      .filter((name) => name && name !== "Rest Day")
      .join(", ");

    if (!workoutNames) {
      console.log(
        "No workout scheduled for the notification time. Rescheduling for the next valid day."
      );
      setTimeout(scheduleDailyNotification, 24 * 60 * 60 * 1000);
      return;
    }

    const title = `Time for your workout, ${
      data.settings.userName || "champ"
    }!`;
    const body = `Today's plan: ${workoutNames}. Let's do this! 💪`;

    const delay = notificationTime.getTime() - now.getTime();

    if (delay > 0) {
      setTimeout(() => {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body,
            icon: "./icon.png",
            tag: "workout-reminder",
          });
          scheduleDailyNotification();
        });
      }, delay);
      console.log(`Notification scheduled for ${notificationTime}`);
    } else {
      setTimeout(scheduleDailyNotification, 60000);
    }
  };

  const setupEventListeners = () => {
    dom.navButtons.forEach((btn) =>
      btn.addEventListener("click", () => switchPage(btn.dataset.page))
    );
    dom.todaysExerciseList.addEventListener("click", (e) => {
      const button = e.target.closest(".log-workout-btn");
      if (button) {
        const workoutId = parseInt(button.dataset.id);
        const workout = data.exercises.find((ex) => ex.id === workoutId);
        const today = new Date();
        const firstLogToday = !data.history.some((h) =>
          isSameDay(h.date, today)
        );
        if (firstLogToday) {
          const yesterday = new Date();
          yesterday.setDate(today.getDate() - 1);
          if (
            data.lastWorkoutDate &&
            isSameDay(data.lastWorkoutDate, yesterday)
          ) {
            data.streak++;
          } else {
            data.streak = 1;
          }
          data.lastWorkoutDate = today.toISOString();
        }
        data.history.push({
          id: workoutId,
          name: workout.name,
          date: today.toISOString(),
        });
        myConfetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        saveAndRerender();
      }
    });
    dom.useFreezeBtn.addEventListener("click", () => {
      data.streakFreeze.count--;
      data.streakFreeze.lastUsed = getTodayStr();
      saveAndRerender();
    });
    dom.scheduleContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("edit-schedule-btn")) {
        openScheduleModal(e.target.dataset.day);
      }
    });
    dom.customExerciseList.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.classList.contains("edit-workout-btn")) {
        openWorkoutModal(parseInt(b.dataset.id));
      }
      if (b.classList.contains("delete-workout-btn")) {
        const id = parseInt(b.dataset.id);
        if (
          confirm(
            "Delete workout? This will remove it from all scheduled days."
          )
        ) {
          data.exercises = data.exercises.filter((x) => x.id !== id);
          for (const d in data.schedule) {
            data.schedule[d] = data.schedule[d].filter((i) => i !== id);
            if (data.schedule[d].length === 0) data.schedule[d] = [1];
          }
          saveAndRerender();
        }
      }
    });
    dom.addNewWorkoutBtn.addEventListener("click", () => openWorkoutModal());
    dom.workoutForm.addEventListener("submit", handleSaveWorkout);
    dom.modalCancelBtn.addEventListener("click", closeWorkoutModal);
    dom.scheduleModalSaveBtn.addEventListener("click", handleSaveSchedule);
    dom.scheduleModalCancelBtn.addEventListener("click", closeScheduleModal);
    dom.userNameInput.addEventListener("change", (e) => {
      data.settings.userName = e.target.value.trim();
      saveAndRerender();
    });
    dom.themeColorInput.addEventListener("input", (e) => {
      data.settings.themeColor = e.target.value;
      renderTheme();
    });
    dom.themeColorInput.addEventListener("change", () => saveData());
    dom.enableNotificationsBtn.addEventListener(
      "click",
      handleNotificationPermission
    );
    dom.notificationTimeInput.addEventListener("change", (e) => {
      data.settings.notifications.time = e.target.value;
      saveData();
      scheduleDailyNotification();
    });
    dom.exportDataBtn.addEventListener("click", () => {
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `workout-companion-backup-${getTodayStr()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
    dom.importDataBtn.addEventListener("click", () =>
      dom.importFileInput.click()
    );
    dom.importFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target.result);
          if (confirm("This will overwrite all current data. Are you sure?")) {
            data = { ...getDefaultData(), ...importedData };
            saveAndRerender();
            alert("Data imported successfully!");
          }
        } catch (err) {
          alert("Error importing file. Make sure it's a valid backup file.");
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    });
    dom.resetAppBtn.addEventListener("click", () => {
      if (
        confirm(
          "Are you sure you want to reset all app data? This cannot be undone."
        )
      ) {
        data = getDefaultData();
        saveAndRerender();
        alert("App data has been reset.");
      }
    });
  };

  const initializeApp = () => {
    setupPWA();
    checkAndResetFreeze();
    checkAndResetStreak();
    setupEventListeners();
    renderAll();
    if ("permissions" in navigator) {
      navigator.permissions
        .query({ name: "notifications" })
        .then((permissionStatus) => {
          data.settings.notifications.permissionState = permissionStatus.state;
          saveAndRerender();
          if (permissionStatus.state === "granted") {
            scheduleDailyNotification();
          }
        });
    }
  };

  initializeApp();
});
