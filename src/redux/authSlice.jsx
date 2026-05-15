import { createSlice } from '@reduxjs/toolkit';
import { clearAuthStorage, getStoredUser, migrateLegacyAuthStorage, setStoredUser } from '../utils/authStorage';

migrateLegacyAuthStorage();
const initialUser = getStoredUser();

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: initialUser,
        isAuthenticated: !!initialUser,
        loading: false,
        error: null,
    },
    reducers: {
        // 1. Set User on Login/Register
        setAuth: (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = true;
            state.loading = false;
            state.error = null;
            setStoredUser(action.payload);
        },

        // 2. Update User Profile (New Feature)
        // This merges new data (like updated address or photo) into the existing user object
        updateUser: (state, action) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
                setStoredUser(state.user);
            }
        },

        // 3. Logout
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.loading = false;
            state.error = null;
            clearAuthStorage();
        },

        // 4. Loading State
        setLoading: (state, action) => {
            state.loading = action.payload;
        },

        // 5. Error Handling
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },

        // 6. Clear Error (Helper)
        clearError: (state) => {
            state.error = null;
        }
    },
});

export const { setAuth, updateUser, logout, setLoading, setError, clearError } = authSlice.actions;
export default authSlice.reducer;
