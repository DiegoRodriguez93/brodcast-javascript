export default {
  generateRandomString() {
    const crypto = window.crypto || window.msCrypto;
    let array = new Uint32Array(1);

    return crypto.getRandomValues(array);
  },

  closeVideo(elemId) {
    if (document.getElementById(elemId)) {
      document.getElementById(elemId).remove();
      this.adjustVideoElemSize();
    }
  },

  pageHasFocus() {
    return !(
      document.hidden ||
      document.onfocusout ||
      window.onpagehide ||
      window.onblur
    );
  },

  getQString(url = "", keyToReturn = "") {
    url = url ? url : location.href;
    let queryStrings = decodeURIComponent(url)
      .split("#", 2)[0]
      .split("?", 2)[1];

    if (queryStrings) {
      let splittedQStrings = queryStrings.split("&");

      if (splittedQStrings.length) {
        let queryStringObj = {};

        splittedQStrings.forEach(function (keyValuePair) {
          let keyValue = keyValuePair.split("=", 2);

          if (keyValue.length) {
            queryStringObj[keyValue[0]] = keyValue[1];
          }
        });

        return keyToReturn
          ? queryStringObj[keyToReturn]
            ? queryStringObj[keyToReturn]
            : null
          : queryStringObj;
      }

      return null;
    }

    return null;
  },

  userMediaAvailable() {
    return !!(
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia
    );
  },

  getUserFullMedia() {
    if (this.userMediaAvailable()) {
      return navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
    } else {
      throw new Error("User media not available");
    }
  },

  getUserAudio() {
    if (this.userMediaAvailable()) {
      return navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
    } else {
      throw new Error("User media not available");
    }
  },

  shareScreen() {
    if (this.userMediaAvailable()) {
      return navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
    } else {
      throw new Error("User media not available");
    }
  },

  getIceServer() {
    return {
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
        {
          username: "sws",
          credential: "webcaster",
          urls: ["turn:54.207.67.134:3478"],
        },
      ],
    };
  },

  addChat(data, senderType) {
    let chatMsgDiv = document.querySelector("#chat-messages");
    let senderName = "Tú";
    let msgBg = "";

    if (senderType === "remote") {
      senderName = data.sender;
      msgBg = "";

      this.toggleChatNotificationBadge();
    }

    var messageDiv = document.createElement("div");
    if (data.admin) {
      messageDiv.className = "msg left-msg";
      senderName = `${senderName} (Administrador)`;
    } else {
      messageDiv.className = "msg right-msg";
    }

    messageDiv.innerHTML = `
        <div class="msg-bubble">
          <div class="msg-info">
            <div class="msg-info-name">
            ${senderName} 
            <i 
            style="cursor: pointer;display: ${data.admin && "none"}"
            onclick="banUser('${senderName}', '${data.senderSocketId}')"
            class="fa fa-user-slash text-danger" ></i>
            </div>
            <div class="msg-info-time">${moment().format("h:mm a")}</div>
          </div>

          <div class="msg-text">
            ${xssFilters.inHTMLData(data.msg)}
          </div>
        </div>`;

    chatMsgDiv.appendChild(messageDiv);

    /**
     * Move focus to the newly added message but only if:
     * 1. Page has focus
     * 2. User has not moved scrollbar upward. This is to prevent moving the scroll position if user is reading previous messages.
     */
    if (this.pageHasFocus) {
      messageDiv.scrollIntoView();
    }
  },

  toggleChatNotificationBadge() {
    if (
      document.querySelector("#chat-panel").classList.contains("chat-opened")
    ) {
      document
        .querySelector("#new-chat-notification")
        .setAttribute("hidden", true);
    } else {
      document
        .querySelector("#new-chat-notification")
        .removeAttribute("hidden");
    }
  },

  replaceTrack(stream, recipientPeer) {
    let sender = recipientPeer.getSenders
      ? recipientPeer
          .getSenders()
          .find((s) => s.track && s.track.kind === stream.kind)
      : false;

    sender ? sender.replaceTrack(stream) : "";
  },

  toggleShareIcons(share) {
    let shareIconElem = document.querySelector("#share-screen");

    if (share) {
      shareIconElem.setAttribute("title", "Stop sharing screen");
      shareIconElem.children[0].classList.add("text-primary");
      shareIconElem.children[0].classList.remove("text-white");
    } else {
      shareIconElem.setAttribute("title", "Share screen");
      shareIconElem.children[0].classList.add("text-white");
      shareIconElem.children[0].classList.remove("text-primary");
    }
  },

  toggleVideoBtnDisabled(disabled) {
    document.getElementById("toggle-video").disabled = disabled;
  },

  maximiseStream(e) {
    let elem = e.target.parentElement.previousElementSibling;

    elem.requestFullscreen() ||
      elem.mozRequestFullScreen() ||
      elem.webkitRequestFullscreen() ||
      elem.msRequestFullscreen();
  },

  singleStreamToggleMute(e) {
    if (e.target.classList.contains("fa-microphone")) {
      e.target.parentElement.previousElementSibling.muted = true;
      e.target.classList.add("fa-microphone-slash");
      e.target.classList.remove("fa-microphone");
    } else {
      e.target.parentElement.previousElementSibling.muted = false;
      e.target.classList.add("fa-microphone");
      e.target.classList.remove("fa-microphone-slash");
    }
  },

  saveRecordedStream(stream, user) {
    let blob = new Blob(stream, { type: "video/webm" });

    let file = new File([blob], `${user}-${moment().unix()}-record.webm`);

    saveAs(file);
  },

  toggleModal(id, show) {
    let el = document.getElementById(id);

    if (show) {
      el.style.display = "block";
      el.removeAttribute("aria-hidden");
    } else {
      el.style.display = "none";
      el.setAttribute("aria-hidden", true);
    }
  },

  setLocalStream(stream, mirrorMode = true) {
    const localVidElem = document.getElementById("local");

    localVidElem.srcObject = stream;
    mirrorMode
      ? localVidElem.classList.add("mirror-mode")
      : localVidElem.classList.remove("mirror-mode");
  },

  adjustVideoElemSize() {
    let elem = document.getElementsByClassName("card");
    let totalRemoteVideosDesktop = elem.length;
    let newWidth =
      totalRemoteVideosDesktop <= 2
        ? "50%"
        : totalRemoteVideosDesktop == 3
        ? "33.33%"
        : totalRemoteVideosDesktop <= 8
        ? "25%"
        : totalRemoteVideosDesktop <= 15
        ? "20%"
        : totalRemoteVideosDesktop <= 18
        ? "16%"
        : totalRemoteVideosDesktop <= 23
        ? "15%"
        : totalRemoteVideosDesktop <= 32
        ? "12%"
        : "10%";

    for (let i = 0; i < totalRemoteVideosDesktop; i++) {
      elem[i].style.width = newWidth;
    }
  },

  createDemoRemotes(str, total = 6) {
    let i = 0;

    let newInterval = setInterval(() => {
      let newVid = document.createElement("video");
      newVid.id = `demo-${i}-video`;
      newVid.srcObject = str;
      newVid.autoplay = true;
      newVid.className = "remote-video";

      //video controls elements
      let controlDiv = document.createElement("div");
      controlDiv.className = "remote-video-controls";
      controlDiv.innerHTML = `<i class="fa fa-microphone text-white pr-3 mute-remote-mic" title="Mute"></i>
                <i class="fa fa-expand text-white expand-remote-video" title="Expand"></i>`;

      //create a new div for card
      let cardDiv = document.createElement("div");
      cardDiv.className = "card card-sm";
      cardDiv.id = `demo-${i}`;
      cardDiv.appendChild(newVid);
      cardDiv.appendChild(controlDiv);

      //put div in main-section elem
      document.getElementById("videos").appendChild(cardDiv);

      this.adjustVideoElemSize();

      i++;

      if (i == total) {
        clearInterval(newInterval);
      }
    }, 2000);
  },
  showListOfUsers() {
    if (localStorage.getItem("listOfUsers")) {
      const listOfUsers = JSON.parse(localStorage.getItem("listOfUsers"));
      let users = "";

      Object.keys(listOfUsers).forEach((key) => {
        users += `<li class="list-group-item" id="${key}">${listOfUsers[key]}</li>`;
      });

      Swal.fire({
        html: `<h4>Lista de usuarios:</h4><ul class="list-group">${users}</ul>`,
      });
    } else {
      Swal.fire(
        "error",
        "En este momento no se pueden listar los usuario, por favor intente mas tarde",
        "error"
      );
    }
  },
  startBroadcast(urlToRedirect = false) {
    fetch("https://ajedrezlatino.com/api/broadcast/api/start-broadcast.php", {
      method: "POST",
    })
      .then((res) => res.json())
      .then((response) => {
        if (response.result && urlToRedirect) {
          location.replace(urlToRedirect);
        }
        if (response.error) {
          Swal.fire(
            "error",
            "Ha ocurrido un error al iniciar la transmisión",
            "error"
          );
        }
      });
  },
  endBroadcast() {
    fetch("https://ajedrezlatino.com/api/broadcast/api/end-broadcast.php", {
      method: "POST",
    })
      .then((res) => res.json())
      .then((response) => {
        if (response.result) {
          location.replace("/");
        }
        if (response.error) {
          Swal.fire(
            "error",
            "Ha ocurrido un error al detener la transmisión",
            "error"
          );
        }
      });
  },
};
