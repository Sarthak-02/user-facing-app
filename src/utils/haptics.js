export function hapticTap() {
  if ("vibrate" in navigator) navigator.vibrate(10);
}

export function hapticSuccess() {
  if ("vibrate" in navigator) navigator.vibrate([10, 50, 10]);
}
