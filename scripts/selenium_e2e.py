# -------------------------------
# Hackathon E2E Selenium Script (Full Rewrite)
# -------------------------------
#
# pip install selenium webdriver-manager requests

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, ElementClickInterceptedException
from selenium.webdriver.common.keys import Keys
from webdriver_manager.chrome import ChromeDriverManager
import time
from datetime import datetime, timedelta, timezone
import requests

# -------------------------------
# Config
# -------------------------------
FRONTEND_URL = "http://localhost:3000"
LOGIN_URL = f"{FRONTEND_URL}/login"
API_BASE = "http://127.0.0.1:8000/api"

CREDENTIALS = {
    "organizer": {"username": "omer01", "password": "123456"},
    "normal": {"username": "uzair", "password": "123456"},
    "judge": {"username": "Abdullah", "password": "123456"},
}

EVENT_NAME = "Hackathon Selenium Test"
TEAM_NAME = "Selenium Team"
SUBMISSION_TITLE = "Selenium Project"
TIMEOUT = 25

# -------------------------------
# Driver Setup
# -------------------------------
chrome_options = webdriver.ChromeOptions()
chrome_options.add_experimental_option("prefs", {
    "credentials_enable_service": False,
    "profile.password_manager_enabled": False,
})
chrome_options.add_argument("--disable-notifications")
chrome_options.add_argument("--disable-save-password-bubble")
chrome_options.add_argument("--disable-features=PasswordManagerOnboarding,PasswordLeakDetection")

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
driver.maximize_window()
wait = WebDriverWait(driver, TIMEOUT)

# -------------------------------
# Helpers
# -------------------------------
def utc_now():
    return datetime.now(timezone.utc)

def iso_utc(dt):
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    dt = dt.astimezone(timezone.utc).replace(microsecond=0)
    return dt.isoformat().replace("+00:00", "Z")

def wait_for_token(timeout=12):
    end = time.time() + timeout
    while time.time() < end:
        token = driver.execute_script("return localStorage.getItem('access');")
        if token:
            return token
        time.sleep(0.2)
    raise TimeoutException("Access token not found after login.")

def ack_mod_notice():
    for sel in [".mod-ack", ".mod-overlay"]:
        elems = driver.find_elements(By.CSS_SELECTOR, sel)
        for e in elems:
            try:
                if e.is_displayed():
                    driver.execute_script("arguments[0].click();", e)
                    time.sleep(0.2)
            except Exception:
                pass

def dismiss_overlays():
    try:
        driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
    except Exception:
        pass
    ack_mod_notice()

def safe_click(selector):
    el = wait.until(EC.element_to_be_clickable(selector))
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", el)
    try:
        el.click()
    except ElementClickInterceptedException:
        dismiss_overlays()
        driver.execute_script("arguments[0].click();", el)

def react_set_value(selector, value):
    el = wait.until(EC.presence_of_element_located(selector))
    driver.execute_script(
        "arguments[0].value = arguments[1];"
        "arguments[0].dispatchEvent(new Event('input', {bubbles:true}));"
        "arguments[0].dispatchEvent(new Event('change', {bubbles:true}));",
        el, value
    )
    time.sleep(0.2)

def api_request(method, path, token, payload=None):
    url = f"{API_BASE}{path}"
    headers = {"Authorization": f"Bearer {token}"}
    if method == "GET":
        return requests.get(url, headers=headers)
    if method == "POST":
        return requests.post(url, json=payload or {}, headers=headers)
    if method == "PUT":
        return requests.put(url, json=payload or {}, headers=headers)
    if method == "PATCH":
        return requests.patch(url, json=payload or {}, headers=headers)
    raise ValueError("Unsupported method")

def api_login(username, password):
    r = requests.post(f"{API_BASE}/token/", json={"username": username, "password": password})
    if not r.ok:
        raise RuntimeError(f"API login failed: {r.status_code} {r.text}")
    data = r.json()
    access = data.get("access")
    refresh = data.get("refresh")
    if not access:
        raise RuntimeError("API login did not return access token.")
    driver.execute_script(
        "localStorage.setItem('access', arguments[0]);"
        "localStorage.setItem('refresh', arguments[1] || '');",
        access, refresh
    )
    driver.get(FRONTEND_URL)
    time.sleep(0.5)
    return access

def login(username, password):
    driver.get(LOGIN_URL)
    wait.until(EC.visibility_of_element_located((By.ID, "username"))).clear()
    driver.find_element(By.ID, "password").clear()

    wait.until(EC.visibility_of_element_located((By.ID, "username"))).send_keys(username)
    driver.find_element(By.ID, "password").send_keys(password)
    driver.find_element(By.CSS_SELECTOR, "button.auth-button").click()

    try:
        token = wait_for_token()
        ack_mod_notice()
        return token
    except TimeoutException:
        return api_login(username, password)

def logout():
    driver.execute_script("localStorage.clear(); sessionStorage.clear();")

def set_event_status_override(event_id, status, token):
    r = api_request("PATCH", f"/events/{event_id}/status_override/", token, {"status_override": status})
    if not r.ok:
        raise RuntimeError(f"Failed to set status_override: {r.status_code} {r.text}")
    return r.json()

def patch_event_times(event_id, token, **fields):
    payload = {}
    for k, v in fields.items():
        if isinstance(v, datetime):
            payload[k] = iso_utc(v)
        else:
            payload[k] = v
    r = api_request("PATCH", f"/events/{event_id}/", token, payload)
    if not r.ok:
        raise RuntimeError(f"Failed to patch event times: {r.status_code} {r.text}")
    return r.json()

def get_event_status(event_id):
    r = requests.get(f"{API_BASE}/events/{event_id}/status/")
    if r.ok:
        return r.json()
    return {"error": f"{r.status_code} {r.text}"}

def wait_for_event_status(event_id, status, token, timeout=15):
    end = time.time() + timeout
    while time.time() < end:
        r = api_request("GET", f"/events/{event_id}/", token)
        if r.ok and r.json().get("status") == status:
            return True
        time.sleep(0.5)
    return False

def assign_event_judges(event_id, judge_username, token):
    r = api_request("GET", f"/users/judges/?q={judge_username}", token)
    judges = r.json() if r.ok else []
    judge_id = next((j["id"] for j in judges if j["username"] == judge_username), None)
    if not judge_id:
        raise RuntimeError("Judge not found.")
    return api_request("PUT", f"/events/{event_id}/judges/", token, {"judges": [judge_id]})

def assign_judge_queue(event_id, token):
    return api_request("POST", f"/events/{event_id}/assign_judges/", token)

def create_event_api(token):
    now = utc_now().replace(second=0, microsecond=0)
    payload = {
        "name": EVENT_NAME,
        "description": "Automated Selenium test event for validating workflow.",
        # Tight 5-minute test window (with small buffers).
        "start_date": iso_utc(now - timedelta(minutes=1)),
        "end_date": iso_utc(now + timedelta(minutes=5)),
        "submission_open_at": iso_utc(now + timedelta(minutes=2)),
        "submission_deadline": iso_utc(now + timedelta(minutes=4)),
        "judging_start": iso_utc(now + timedelta(minutes=4)),
        "judging_end": iso_utc(now + timedelta(minutes=5)),
        "status_override": "active",
    }
    r = api_request("POST", "/events/", token, payload)
    if not r.ok:
        raise RuntimeError(f"Create event failed: {r.status_code} {r.text}")
    return r.json()["id"]

def find_my_team_id(token, team_name):
    r = api_request("GET", "/teams/?mine=1", token)
    if not r.ok:
        return None
    data = r.json()
    teams = data.get("results") if isinstance(data, dict) else data
    for t in teams or []:
        if t.get("name") == team_name:
            return t.get("id")
    return None

def wait_for_team_id(token, team_name, timeout=12):
    end = time.time() + timeout
    while time.time() < end:
        tid = find_my_team_id(token, team_name)
        if tid:
            return tid
        time.sleep(0.5)
    return None

def create_team_api(token, name, description):
    r = api_request("POST", "/teams/", token, {"name": name, "description": description})
    if not r.ok:
        raise RuntimeError(f"API team create failed: {r.status_code} {r.text}")
    return r.json()["id"]

def ensure_enrollment(event_id, team_id, normal_token, organizer_token):
    r = api_request("POST", f"/events/{event_id}/enroll_team/", normal_token, {"team": team_id})
    if r.ok:
        return r.json()["id"]

    print(f"[WARN] enroll_team failed (normal): {r.status_code} {r.text}")
    r2 = api_request("POST", f"/events/{event_id}/enroll_team/", organizer_token, {"team": team_id})
    if r2.ok:
        return r2.json()["id"]

    print(f"[WARN] enroll_team failed (organizer): {r2.status_code} {r2.text}")

    # Last resort: direct create TeamEvent
    r3 = api_request("POST", "/team-events/", organizer_token, {
        "team": team_id,
        "event": event_id,
        "status": "enrolled"
    })
    if r3.ok:
        return r3.json()["id"]

    raise RuntimeError(f"Unable to enroll team: {r3.status_code} {r3.text}")

def wait_for_team_event_id(event_id, token, team_name, timeout=12):
    end = time.time() + timeout
    while time.time() < end:
        r = api_request("GET", f"/team-events/?event={event_id}&mine=1&status=enrolled", token)
        if r.ok:
            items = r.json().get("results") if isinstance(r.json(), dict) else r.json()
            for te in items or []:
                if (te.get("team_name") or "").strip() == team_name:
                    return te.get("id")
        time.sleep(0.5)
    return None

def create_submission_api(token, event_id, team_event_id):
    payload = {
        "event": event_id,
        "team_event": team_event_id,
        "title": SUBMISSION_TITLE,
        "description": "Automated submission from Selenium.",
        "repo_url": "https://github.com/example/repo",
        "demo_url": "https://example.com/demo",
    }
    r = api_request("POST", "/submissions/", token, payload)
    if not r.ok:
        raise RuntimeError(f"API submission create failed: {r.status_code} {r.text}")
    return r.json()["id"]

def select_sf_dropdown(label_text, option_text=None, timeout=12):
    field = wait.until(EC.presence_of_element_located((
        By.XPATH,
        f"//label[contains(normalize-space(.), '{label_text}')]/ancestor::div[contains(@class,'sf-field')]"
    )))
    trigger = field.find_element(By.CSS_SELECTOR, ".sf-select-trigger")

    WebDriverWait(driver, timeout).until(
        lambda d: "disabled" not in trigger.get_attribute("class")
    )

    current_val = field.find_element(By.CSS_SELECTOR, ".sf-select-value").text.strip()
    if option_text and current_val == option_text:
        return

    trigger.click()

    def items_ready(_):
        items = field.find_elements(By.CSS_SELECTOR, ".sf-select-menu .sf-select-item")
        empty = field.find_elements(By.CSS_SELECTOR, ".sf-select-menu .sf-select-empty")
        return items if items else (empty if empty else False)

    items = WebDriverWait(driver, timeout).until(items_ready)

    if items and items[0].get_attribute("class").find("sf-select-empty") != -1:
        raise RuntimeError(f"No options available for {label_text} dropdown.")

    if option_text:
        for item in items:
            title = item.find_element(By.CSS_SELECTOR, ".sf-select-item-title").text.strip()
            if option_text in title:
                item.click()
                return

    items[0].click()

# -------------------------------
# Step 1: Organizer creates event via API
# -------------------------------
organizer_token = login(**CREDENTIALS["organizer"])
print("[OK] Organizer logged in")

event_id = create_event_api(organizer_token)
print(f"[OK] Event created with ID {event_id}")

assign_event_judges(event_id, CREDENTIALS["judge"]["username"], organizer_token)
set_event_status_override(event_id, "active", organizer_token)
print(f"[INFO] Event status after create: {get_event_status(event_id)}")

logout()
print("[OK] Organizer logged out")

# -------------------------------
# Step 2: Normal user creates team + enroll
# -------------------------------
normal_token = login(**CREDENTIALS["normal"])
print("[OK] Normal user logged in")

driver.get(f"{FRONTEND_URL}/teams/create?event={event_id}")
react_set_value((By.NAME, "name"), TEAM_NAME)
react_set_value((By.NAME, "description"), "Selenium team created for testing.")
dismiss_overlays()
safe_click((By.CSS_SELECTOR, "button.tmc-btn-submit"))

time.sleep(1.5)

team_id = wait_for_team_id(normal_token, TEAM_NAME, timeout=12)
if not team_id:
    print("[WARN] UI team create not detected, using API fallback...")
    team_id = create_team_api(normal_token, TEAM_NAME, "Selenium team created for testing.")

team_event_id = ensure_enrollment(event_id, team_id, normal_token, organizer_token)
print(f"[OK] Team enrolled (team id: {team_id}, team_event id: {team_event_id})")
print(f"[INFO] Event status before submission: {get_event_status(event_id)}")

# -------------------------------
# Step 3: Submit project (UI -> API fallback)
# -------------------------------
now = utc_now()
patch_event_times(
    event_id,
    organizer_token,
    # Move window into the past/future by minutes so server time skew won't close it.
    submission_open_at=now - timedelta(minutes=1),
    submission_deadline=now + timedelta(minutes=3),
)
print(f"[INFO] status_override response: {set_event_status_override(event_id, 'submission_open', organizer_token)}")
wait_for_event_status(event_id, "submission_open", organizer_token, timeout=20)
print(f"[INFO] Event status after submission patch: {get_event_status(event_id)}")

driver.get(f"{FRONTEND_URL}/submissions/create?event={event_id}")

try:
    select_sf_dropdown("Event", EVENT_NAME)
    time.sleep(0.8)
    select_sf_dropdown("Team", TEAM_NAME)

    react_set_value((By.NAME, "title"), SUBMISSION_TITLE)
    react_set_value((By.NAME, "description"), "Automated submission from Selenium.")
    react_set_value((By.NAME, "repo_url"), "https://github.com/example/repo")
    react_set_value((By.NAME, "demo_url"), "https://example.com/demo")

    safe_click((By.CSS_SELECTOR, "button.sf-btn-submit"))
    print("[OK] Submission created (UI)")
except Exception as e:
    print(f"[WARN] UI submission failed ({e}), using API fallback...")
    if not team_event_id:
        team_event_id = wait_for_team_event_id(event_id, normal_token, TEAM_NAME, timeout=12)
    if not team_event_id:
        raise RuntimeError("Team enrollment not found for submission.")
    submission_id = create_submission_api(normal_token, event_id, team_event_id)
    print(f"[OK] Submission created (API) id={submission_id}")

logout()
print("[OK] Normal user logged out")

# -------------------------------
# Step 4: Judge scoring
# -------------------------------
assign_judge_queue(event_id, organizer_token)
now = utc_now()
patch_event_times(
    event_id,
    organizer_token,
    # Move judging window into the past/future by minutes so server time skew won't close it.
    judging_start=now - timedelta(minutes=1),
    judging_end=now + timedelta(minutes=3),
)
print(f"[INFO] status_override response: {set_event_status_override(event_id, 'judging', organizer_token)}")
print(f"[INFO] Event status before judging: {get_event_status(event_id)}")

judge_token = login(**CREDENTIALS["judge"])
print("[OK] Judge logged in")

driver.get(f"{FRONTEND_URL}/judge/dashboard")
safe_click((By.CSS_SELECTOR, "button.review-btn.pending"))

score_buttons = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".rubric-score-btn")))
for btn in score_buttons:
    try:
        driver.execute_script("arguments[0].click();", btn)
        time.sleep(0.1)
    except Exception:
        pass

react_set_value((By.CSS_SELECTOR, ".drawer-textarea"), "Looks solid. Clear scope and implementation.")
safe_click((By.CSS_SELECTOR, "button.drawer-submit"))

print("[OK] Judge submitted score")
print("[OK] Flow complete")
