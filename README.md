# Kelowna Weather Planner — COSC 219 M2 Prototype

**Course:** COSC 219 · Okanagan College  
**Project partners:** Jobanpreet Singh and Harsahib Singh

## What this prototype does

The page loads **real current weather** and a **7-day forecast** for Kelowna using Open-Meteo. You can search for a different city, switch between Celsius and Fahrenheit, and save favourite cities in your browser.

It is an **M2 prototype**, not the complete final (M4) submission. The goal is to prove that live API requests work in the browser and that users can interact with the results.

## Run it

1. Keep `index.html`, `styles.css`, and `app.js` in the same folder.
2. Open this folder in VS Code.
3. Right-click `index.html` and choose **Open with Live Server**.
4. Wait for the weather to load; an internet connection is required.
5. Test three interactions: search for **Vancouver**, choose **°F**, and click **Save city**.
6. To test a failure, disconnect from the internet and reload; a visible message should appear.
7. Search for an invented name (e.g. `zzzxxyyqq`) to see the empty-results message.

**Do not edit an unrelated `index.html` in your existing COSC219 site.** Keep the files together in a separate project folder or dedicated repository.

## APIs used

- Open-Meteo Forecast API: https://open-meteo.com/en/docs
- Open-Meteo Geocoding API: https://open-meteo.com/en/docs/geocoding-api

The app calls the public API from JavaScript `fetch()`. No secret key or server is used. Forecast data is **not hard-coded**.

## M2 rubric checklist

- [x] Live API data rendered to the webpage (`fetch` in `app.js`)
- [x] Readable layout (`index.html` and `styles.css`)
- [x] User interaction (city search, units, favourites)
- [ ] Verified in browser with Live Server (complete this yourself)
- [ ] Uploaded to a GitHub repository and submitted its link (complete this yourself)

## Notes toward the final project (M4)

The final specification expects a modular `js/` directory, a `css/` directory, complete README statements, accessibility and responsive testing, all four UI states, and GitHub Pages deployment. These are **M4 expectations**, not extra M2 submission requirements.

**Design note (draft):** We chose Open-Meteo because it offers weather forecasts and city lookup directly from the browser without a secret API key. A full mapping application was not necessary for a small weather planner, so we started with a searchable forecast page instead.

**Accessibility note (verify during testing):** The interface uses labelled inputs, real buttons, visible keyboard focus, and a live status message. We still need to test keyboard navigation and use a browser accessibility checker before the final submission.

**AI-use statement:** ChatGPT helped draft this prototype code and README. We must review, test, understand, and appropriately declare this assistance following the course Lecture 1 policy before submission.

**Division of work:** Both partners should review and test the project. Add the **actual feature ownership and contributions** here as you work; do not claim work that someone else did. Both partners should make genuine Git commits, as required by the specification.
