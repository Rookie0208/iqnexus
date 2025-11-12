import { createSlice } from "@reduxjs/toolkit";

// Initialize state from localStorage with expiration check
const initialState = () => {
  const expirationTime = localStorage.getItem("auth_expiration");
  const currentTime = new Date().getTime();

  // Check if data exists and is not expired
  if (expirationTime && currentTime < parseInt(expirationTime)) {
    return {
      user: localStorage.getItem("student_data")
        ? JSON.parse(localStorage.getItem("student_data"))
        : null,
      token: localStorage.getItem("student_mobile") || null,
    };
  } else {
    // Clear localStorage if expired
    localStorage.removeItem("student_data");
    localStorage.removeItem("student_mobile");
    localStorage.removeItem("auth_expiration");
    return { user: null, token: null };
  }
};

const authSlice = createSlice({
  name: "auth",
  initialState: initialState(),
  reducers: {
    login: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("student_data");
      localStorage.removeItem("student_mobile");
      localStorage.removeItem("auth_expiration");
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;