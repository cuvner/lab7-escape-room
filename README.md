# Lab 7 Lockdown

A micro:bit escape room for Year 7. Students program a micro:bit in MakeCode blocks. The micro:bit sends messages over USB, and this web page reads them to open six locks.

**What's in this folder**

| File | What it does |
|---|---|
| `index.html` | The escape room. This goes on GitHub Pages. |
| `apps-script/Code.gs` | Logs progress to a Google Sheet and serves the dashboard. |
| `apps-script/Dashboard.html` | The teacher dashboard page. |

---

## 1. Put the escape room on GitHub Pages

1. On GitHub, create a new **public** repository (for example `lab7-lockdown`).
2. Click **Add file > Upload files** and upload `index.html`. You don't need the `apps-script` folder in the repo.
3. Go to **Settings > Pages**. Under Branch, choose `main` and `/ (root)`, then click **Save**.
4. After a minute, the site will be live at `https://YOUR-USERNAME.github.io/lab7-lockdown/`.

## 2. Set up the Google Sheet and dashboard

1. Create a new Google Sheet in your school account. Name it something like `Lab 7 Lockdown log`.
2. Go to **Extensions > Apps Script**.
3. Replace everything in `Code.gs` with the contents of `apps-script/Code.gs`.
4. Change `DASHBOARD_KEY` at the top to a word only you know.
5. Click **+ > HTML**, name the file `Dashboard` (exactly), and paste in the contents of `apps-script/Dashboard.html`.
6. Pick `setup` in the function menu and click **Run**. Approve the permissions when prompted. A `Log` tab will appear in the sheet.
7. Click **Deploy > New deployment**. Choose **Web app** as the type, then set:
   - Execute as: **Me**
   - Who has access: **Anyone** (students aren't signed in, so this setting is needed for their page to send progress)
8. Click **Deploy** and copy the **Web app URL**.

## 3. Connect the two

1. In `index.html`, find the `CONFIG` section near the bottom and paste the web app URL into `SCRIPT_URL`.
2. Update `CLASSES` to your real class names, and change `TEACHER_PIN`.
3. Upload the new `index.html` to GitHub to replace the old one.

To open your dashboard, use the web app URL with your key on the end:

```
https://script.google.com/macros/s/....../exec?key=YOUR-KEY
```

It refreshes every 30 seconds. Bookmark it on your teacher PC.

> If you edit `Code.gs` later, go to **Deploy > Manage deployments**, click the pencil icon, choose **New version**, and click **Deploy**. Otherwise the old code keeps running.

---

## Testing without a micro:bit

Open the site with `?teacher` on the end, or press **Ctrl+Shift+T**, then enter your PIN. The teacher panel lets you:

- **Send** a fake micro:bit message (type `HELLO`, `LASER`, `count:5` and so on)
- **Skip lock** for a student whose hardware has failed (this shows as a **T** on the dashboard)
- **Answer** to show what the current lock needs

## What each lock listens for

These are the messages the micro:bit must send. The slides will teach the blocks.

| Stage | Message | Typical blocks |
|---|---|---|
| Key online | `HELLO` | `on start` → `serial write line "HELLO"` |
| Lock 1: Keypad | `LASER` | `on button A+B pressed` → `serial write line "LASER"` |
| Lock 2: Bugs | `count:N` | `on button A` → `change count by 1`, `show number count`. `on button B` → `serial write value "count" = count` |
| Lock 3: Tilt | `LEFT` `RIGHT` `SHAKE` `FLIP` | `on tilt left` / `on tilt right` / `on shake` / `on screen down` → `serial write line` |
| Lock 4: Lights out | `DARK` x3 | `forever` → `if light level < 30` → `serial write line "DARK"`, `pause 500` |
| Lock 5: Reactor | `reactor:10` down to `reactor:1` | `on logo pressed` → `set reactor to 10`, `repeat 10 times` → `serial write value "reactor" = reactor`, `show number`, `change reactor by -1`, `pause 1000` |
| Final door | `escape:N` | `forever` → `if sound level > 150 and light level < 30` → `serial write value "escape" = count`, `pause 1000` |

All of these live in **one program** that grows each lesson, so a full replay takes a few minutes.

The page also accepts plain numbers (`5`) and joined text (`ESCAPE5`), so small differences in student code still work.

## Troubleshooting

| Problem | Fix |
|---|---|
| "This browser cannot talk to a micro:bit" | Use Chrome or Edge. Safari and Firefox don't support Web Serial. |
| Connect fails or nothing appears in the signal log | In MakeCode, click the three dots next to Download and choose **Disconnect**. Then unplug and replug the micro:bit and click **Connect key**. |
| Connected but HELLO never arrives | Press the **reset button** on the back of the micro:bit so `on start` runs again. |
| Lights out never triggers | Show `light level` on the screen to check the reading under a hand. Adjust 30 if needed. |
| Final door triggers from classroom noise | It also needs darkness and the right count, so this is rare. Raise the 150 threshold if needed. |
| Dashboard empty | Check `SCRIPT_URL` is pasted in and the deployment access is set to **Anyone**. The school network may also block `script.google.com`. The game still works without it. |

## Settings in `index.html`

```js
const CONFIG = {
  SCRIPT_URL: '',          // Apps Script web app URL
  CLASSES: ['7A','7B',...],
  TEACHER_PIN: '7777',
  PASSWORD: 'LASER'        // Lock 1 password, split across three clues
};
```

Bugs, tilt sequence and final door count are randomised on every play, so students can't copy each other's answers.
