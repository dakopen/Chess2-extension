/**
 * This script customizes chat presets on Lichess.
 * - Adds custom buttons to the chat presets container.
 * - Updates the chat input when a custom button is clicked.
 * - Changes the title of the voice chat tab to "Call the Exorcist".
 */

const existingChatPresets = document.querySelector(".mchat__presets");
const chatInput = document.querySelector(".mchat__content input");
const chat = document.querySelector(".mchat__content");

if (existingChatPresets) {
    // clear existing chat presets
    existingChatPresets.innerHTML = "";
    if (DEBUG_CHESS2) {
        console.log("Existing chat presets cleared.");
    }
}

if (DEBUG_CHESS2) {
    console.log("Player color: ", playerColor);
}

if (chat && chatInput) {
    const siblingContainer = document.createElement("div");
    siblingContainer.classList.add("mchat__presets__lookalike");
    if (DEBUG_CHESS2) {
        console.log("Sibling container created.");
    }
    // insert at the end of the chat container
    chat.insertBefore(siblingContainer, null);

    const customShortcuts = [
        { title: "google en passant", text: "gep" },
        { title: "Holy hell!", text: "response" },
        {
            title: 'Are you kidding ??? What the **** are you talking about man ? You are a biggest looser i ever seen in my life ! You was doing PIPI in your pampers when i was beating players much more stronger then you! You are not proffesional, because proffesionals knew how to lose and congratulate opponents, you are like a girl crying after i beat you! Be brave, be honest to yourself and stop this trush talkings!!! Everybody know that i am very good blitz player, i can win anyone in the world in single game! And "w"esley "s"o is nobody for me, just a player who are crying every single time when loosing, ( remember what you say about Firouzja ) !!! Stop playing with my name, i deserve to have a good name during whole my chess carrier, I am Officially inviting you to OTB blitz match with the Prize fund! Both of us will invest 5000$ and winner takes it all! I suggest all other people who\'s intrested in this situation, just take a look at my results in 2016 and 2017 Blitz World championships, and that should be enough... No need to listen for every crying babe, Tigran Petrosyan is always play Fair ! And if someone will continue Officially talk about me like that, we will meet in Court! God bless with true! True will never die ! Liers will kicked off...',
            text: "pipi",
        },
        { title: `What should I do in this position? I am ${playerColor} btw`, text: "help" },
    ];

    customShortcuts.forEach((shortcut) => {
        const spanElement = document.createElement("span");
        spanElement.title = shortcut.title;
        spanElement.textContent = shortcut.text;

        // add click event listener to update chat input
        spanElement.addEventListener("click", async () => {
            let remaining = shortcut.title;

            while (remaining.length > 0) {
                // Find the slice point within 140 characters, stopping at the last whitespace
                const slicePoint = remaining.lastIndexOf(" ", 140);
                if (slicePoint === -1) {
                    // If there is no whitespace, slice at 140 characters
                    slicePoint = 140;
                }
                const slice = remaining.slice(0, slicePoint);
                chatInput.value = slice;
                chatInput.dispatchEvent(new Event("input", { bubbles: true }));
                chatInput.dispatchEvent(
                    new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
                );
                remaining = remaining.slice(slicePoint);

                // wait for 2 seconds
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }
        });

        siblingContainer.appendChild(spanElement);
        const spanStyle = document.createElement("style");
        spanStyle.textContent = `
        .mchat__presets__lookalike span {
            flex: 1 1 auto;
            text-align: center;
            display: block;
            opacity: .8;
            border: 1px solid var(--c-border);
            border-width: 1px 1px 0 0;
            font-size: .9em;
            text-transform: uppercase;
            cursor: pointer;
            transition: all 150ms;
        }

        .mchat__presets__lookalike {
            display: flex;
            flex: 0 0 auto;
            align-items: center;
            flex-flow: row nowrap;
            line-height: 1.4em;
            user-select: none
        }
        `;
        // append the style to the head
        document.head.appendChild(spanStyle);
    });
}

// Call the Exorcist
const voiceChat = document.querySelector(".mchat__tab.palantir.palantir-slot");
if (voiceChat) {
    // change the title
    voiceChat.title = "Call the Exorcist";
    if (DEBUG_CHESS2) {
        console.log("Voice chat title updated.");
    }
}
