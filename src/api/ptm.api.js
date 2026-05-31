import api from "./axios";

// ── Slots ────────────────────────────────────────────────────────────────────

export async function createPtmSlot(data) {
  try {
    const response = await api.post("/ptm/slot", data);
    return response.data?.data || response.data;
  } catch (err) {
    console.error("Error creating PTM slot:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function getPtmSlotById(slot_id) {
  try {
    const response = await api.get(`/ptm/slot/${slot_id}`);
    return response.data?.data || response.data;
  } catch (err) {
    console.error("Error fetching PTM slot:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function getPtmSlotsByTeacher(params = {}) {
  try {
    const response = await api.get("/ptm/slot/teacher/all", { params });
    return response.data?.data || response.data || [];
  } catch (err) {
    console.error("Error fetching teacher PTM slots:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function getPtmSlotsByCampus(params = {}) {
  try {
    const response = await api.get("/ptm/slot/campus/all", { params });
    return response.data?.data || response.data || [];
  } catch (err) {
    console.error("Error fetching campus PTM slots:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function getAvailablePtmSlots(params = {}) {
  try {
    const response = await api.get("/ptm/slot/available", { params });
    return response.data?.data || response.data || [];
  } catch (err) {
    console.error("Error fetching available PTM slots:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function updatePtmSlot(slot_id, data) {
  try {
    const response = await api.patch(`/ptm/slot/${slot_id}`, data);
    return response.data?.data || response.data;
  } catch (err) {
    console.error("Error updating PTM slot:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function cancelPtmSlot(slot_id) {
  try {
    const response = await api.delete(`/ptm/slot/${slot_id}`);
    return response.data;
  } catch (err) {
    console.error("Error cancelling PTM slot:", err.response?.data);
    throw err.response?.data || err;
  }
}

// ── Bookings ─────────────────────────────────────────────────────────────────

// studentBookings: [{ student_id, parent_id? }, ...]
export async function parentBookSlot(slot_id, studentBookings) {
  try {
    const response = await api.post(`/ptm/slot/${slot_id}/book`, { bookings: studentBookings });
    return response.data?.data || response.data;
  } catch (err) {
    console.error("Error booking PTM slot:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function createPtmBooking(data) {
  try {
    const response = await api.post("/ptm/booking", data);
    return response.data?.data || response.data;
  } catch (err) {
    console.error("Error creating PTM booking:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function getPtmBookingById(booking_id) {
  try {
    const response = await api.get(`/ptm/booking/${booking_id}`);
    return response.data?.data || response.data;
  } catch (err) {
    console.error("Error fetching PTM booking:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function getPtmBookingsByStudent(params = {}) {
  try {
    const response = await api.get("/ptm/booking/student/all", { params });
    return response.data?.data || response.data || [];
  } catch (err) {
    console.error("Error fetching student PTM bookings:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function getPtmBookingsByTeacher(params = {}) {
  try {
    const response = await api.get("/ptm/booking/teacher/all", { params });
    return response.data?.data || response.data || [];
  } catch (err) {
    console.error("Error fetching teacher PTM bookings:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function completePtmBooking(booking_id, data = {}) {
  try {
    const response = await api.post(`/ptm/booking/${booking_id}/complete`, data);
    return response.data?.data || response.data;
  } catch (err) {
    console.error("Error completing PTM booking:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function markPtmNoShow(booking_id) {
  try {
    const response = await api.post(`/ptm/booking/${booking_id}/no-show`);
    return response.data?.data || response.data;
  } catch (err) {
    console.error("Error marking PTM no-show:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function cancelPtmBooking(booking_id, data = {}) {
  try {
    const response = await api.post(`/ptm/booking/${booking_id}/cancel`, data);
    return response.data?.data || response.data;
  } catch (err) {
    console.error("Error cancelling PTM booking:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function updatePtmNotes(booking_id, teacher_notes) {
  try {
    const response = await api.patch(`/ptm/booking/${booking_id}/notes`, { teacher_notes });
    return response.data?.data || response.data;
  } catch (err) {
    console.error("Error updating PTM notes:", err.response?.data);
    throw err.response?.data || err;
  }
}

export async function sendPtmReminder(booking_id) {
  try {
    const response = await api.post(`/ptm/booking/${booking_id}/reminder`);
    return response.data?.data || response.data;
  } catch (err) {
    console.error("Error sending PTM reminder:", err.response?.data);
    throw err.response?.data || err;
  }
}
