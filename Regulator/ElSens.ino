
const int ELSENS_MIN_ON_VALUE = 655;
const int ELSENS_MIN_HEATING_VALUE = ELSENS_MIN_ON_VALUE + 100;
const unsigned long OVERHEATED_COOLDOWN_TIME = PUMP_STOP_MILLIS - 30000; // resume 30 sec before pump stops

unsigned long overheatedStart = 0;

boolean elsensLoop() {

  elsens = readElSens();

  // waiting for water to cooldown
  if (overheatedStart != 0 && (loopStartMillis - overheatedStart) < OVERHEATED_COOLDOWN_TIME && !buttonPressed)
    return false;
  overheatedStart = 0;

  if (heatingPower > 0 && elsens < ELSENS_MIN_HEATING_VALUE) {
    overheatedStart = loopStartMillis;
    state = RegulatorState::OVERHEATED;
    sprintfF(msg, F("overheated"));
    eventsWrite(OVERHEAT_EVENT, elsens, 0);
    alarmSound();
    return false;
  }
  float ratio = (float) elsens / 11000;
  elsensPower = (int) ((float) elsens * 0.192 * sin(ratio * PI/2)) - PUMP_POWER;
  return true;
}

boolean elsensCheckPump() {
  delay(1000); // pump run-up
  int v = readElSens();
  if (v < ELSENS_MIN_ON_VALUE) {
    digitalWrite(MAIN_RELAY_PIN, LOW);
    mainRelayOn = false;
    alarmCause = AlarmCause::PUMP;
    eventsWrite(PUMP_EVENT, v, ELSENS_MIN_ON_VALUE);
    return false;
  }
  return true;
}

byte overheatedSecondsLeft() {
  return (OVERHEATED_COOLDOWN_TIME - (loopStartMillis - overheatedStart)) / 1000;
}

int readElSens() {
  long sum = 0;
  int n = 0;
  long start_time = millis();
  while(millis() - start_time < 400) { // in 400 ms measures 20 50Hz AC oscillations
    sum += analogRead(ELSENS_PIN);
    n++;
  }
  return sum * 100 / n;
}