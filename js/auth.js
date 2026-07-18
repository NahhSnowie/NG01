(function() {
    // ----- FIREBASE KHỞI TẠO -----
    const firebaseConfig = {
        apiKey : "AIzaSyCZn5vuwwmSuuu_cjE_z-6ZDAiN_pOj3wo",
        authDomain : "find-job-b4311.firebaseapp.com",
        projectId : "find-job-b4311",
        storageBucket : "find-job-b4311.firebasestorage.app",
        messagingSenderId : "34102923819",
        appId : "1:34102923819:web:a625c25514df9619e5106e",
        measurementId : "G-RGRJ8V33KM"
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth();

    window.firebaseApp = firebase.app();
    window.db = db;
    window.auth = auth;

    let authMode = 'login';

    const openAuthBtn = document.getElementById('openAuthBtn');
    const authForm = document.getElementById('authForm');
    const cancelAuthBtn = document.getElementById('cancelAuthBtn');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const toggleAuthModeBtn = document.getElementById('toggleAuthModeBtn');
    const authModeText = document.getElementById('authModeText');
    const authNameInput = document.getElementById('authNameInput');
    const authEmailInput = document.getElementById('authEmail');
    const authEmailGroup = document.getElementById('authEmailGroup');
    const authPasswordInput = document.getElementById('authPassword');
    const authAddressInput = document.getElementById('authAddressInput');
    const authTaxInput = document.getElementById('authTaxInput');
    const authConfirmPasswordInput = document.getElementById('authConfirmPasswordInput');
    const authMessage = document.getElementById('authMessage');
    const authStatus = document.getElementById('authStatus');
    const profileBtn = document.getElementById('profileBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const authModalOverlay = document.getElementById('authModalOverlay');
    const closeAuthModal = document.getElementById('closeAuthModal');

    function showAuthMessage(message, isError = false) {
        if (!authMessage) return;
        authMessage.textContent = message;
        authMessage.style.color = isError ? '#d9534f' : '#28a745';
    }

    function setAuthMode(mode) {
        authMode = mode;
        const isRegister = mode === 'register';
        if (authNameInput && authNameInput.parentElement) {
            authNameInput.parentElement.style.display = 'block';
        }
        if (authEmailGroup) {
            authEmailGroup.style.display = isRegister ? 'block' : 'none';
        }
        const extraFields = document.getElementById('authExtraFields');
        if (extraFields) {
            extraFields.style.display = isRegister ? 'flex' : 'none';
        }
        if (authForm) {
            authForm.classList.toggle('register-mode', isRegister);
        }
        if (authSubmitBtn) {
            authSubmitBtn.innerHTML = isRegister ? '<i class="fas fa-user-plus"></i> Đăng ký' : '<i class="fas fa-sign-in-alt"></i> Đăng nhập';
        }
        if (toggleAuthModeBtn) {
            toggleAuthModeBtn.textContent = isRegister ? 'Đăng nhập' : 'Đăng ký';
        }
        if (authModeText) {
            authModeText.textContent = isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?';
        }
        showAuthMessage('');
    }

    function openAuthForm() {
        if (authModalOverlay) {
            authModalOverlay.style.display = 'flex';
        } else {
            window.location.href = 'auth.html?mode=' + authMode;
            return;
        }
        setAuthMode(authMode);
    }

    function closeAuthForm() {
        if (authModalOverlay) {
            authModalOverlay.style.display = 'none';
        }
        showAuthMessage('');
    }

    function clearAuthForm() {
        if (authNameInput) authNameInput.value = '';
        if (authEmailInput) authEmailInput.value = '';
        if (authPasswordInput) authPasswordInput.value = '';
        if (authAddressInput) authAddressInput.value = '';
        if (authTaxInput) authTaxInput.value = '';
        if (authConfirmPasswordInput) authConfirmPasswordInput.value = '';
    }

    function updateUserStatus(user) {
        if (!authStatus || !openAuthBtn || !profileBtn || !logoutBtn) return;
        if (user) {
            const displayName = user.displayName || user.email || 'Tài khoản';
            authStatus.textContent = `Xin chào ${displayName}`;
            openAuthBtn.style.display = 'none';
            profileBtn.style.display = 'inline-flex';
            logoutBtn.style.display = 'inline-flex';
        } else {
            authStatus.textContent = 'Khách';
            openAuthBtn.style.display = 'inline-flex';
            profileBtn.style.display = 'none';
            logoutBtn.style.display = 'none';
        }
    }

    function saveUserProfile(user, companyName, address, taxCode) {
        return db.collection('users').doc(user.uid).set({
            email: user.email,
            companyName: companyName || '',
            address: address || '',
            taxCode: taxCode || '',
            accountType: 'company',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }

    function loginUser() {
        const companyName = authNameInput.value.trim();
        const password = authPasswordInput.value.trim();
        if (!companyName || !password) {
            showAuthMessage('Vui lòng nhập tên công ty và mật khẩu.', true);
            return;
        }

        db.collection('users').where('companyName', '==', companyName).limit(1).get()
            .then(snapshot => {
                if (snapshot.empty) {
                    throw new Error('Tài khoản công ty không tồn tại.');
                }
                const data = snapshot.docs[0].data();
                if (data.accountType !== 'company') {
                    throw new Error('Chỉ tài khoản công ty mới được phép đăng nhập.');
                }
                return auth.signInWithEmailAndPassword(data.email, password);
            })
            .then(() => {
                showAuthMessage('Đăng nhập thành công.');
                clearAuthForm();
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 400);
            })
            .catch(error => {
                showAuthMessage(error.message, true);
            });
    }

    function registerUser() {
        const companyName = authNameInput.value.trim();
        const email = authEmailInput.value.trim();
        const password = authPasswordInput.value.trim();
        const confirmPassword = authConfirmPasswordInput.value.trim();
        const address = authAddressInput.value.trim();
        const taxCode = authTaxInput.value.trim();

        if (!companyName) {
            showAuthMessage('Vui lòng nhập tên công ty.', true);
            return;
        }
        if (!email || !password) {
            showAuthMessage('Vui lòng nhập email và mật khẩu.', true);
            return;
        }
        if (password !== confirmPassword) {
            showAuthMessage('Mật khẩu xác nhận không khớp.', true);
            return;
        }
        if (!address) {
            showAuthMessage('Vui lòng nhập địa chỉ công ty.', true);
            return;
        }
        if (!taxCode) {
            showAuthMessage('Vui lòng nhập mã số thuế.', true);
            return;
        }

        db.collection('users').where('companyName', '==', companyName).limit(1).get()
            .then(snapshot => {
                if (!snapshot.empty) {
                    throw new Error('Tên công ty đã được đăng ký.');
                }
                return auth.createUserWithEmailAndPassword(email, password);
            })
            .then(result => saveUserProfile(result.user, companyName, address, taxCode))
            .then(() => {
                showAuthMessage('Đăng ký thành công.');
                clearAuthForm();
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 400);
            })
            .catch(error => {
                showAuthMessage(error.message, true);
            });
    }

    function handleAuthSubmit(e) {
        e.preventDefault();
        if (authMode === 'register') {
            registerUser();
        } else {
            loginUser();
        }
    }

    if (openAuthBtn) {
        openAuthBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'auth.html?mode=' + authMode;
        });
    }
    if (cancelAuthBtn) {
        cancelAuthBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeAuthForm();
        });
    }
    if (closeAuthModal) {
        closeAuthModal.addEventListener('click', function(e) {
            e.preventDefault();
            closeAuthForm();
        });
    }
    if (authModalOverlay) {
        authModalOverlay.addEventListener('click', function(e) {
            if (e.target === authModalOverlay) {
                closeAuthForm();
            }
        });
    }
    if (authSubmitBtn) {
        authSubmitBtn.addEventListener('click', handleAuthSubmit);
    }
    if (toggleAuthModeBtn) {
        toggleAuthModeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            setAuthMode(authMode === 'login' ? 'register' : 'login');
        });
    }
    if (profileBtn) {
        profileBtn.addEventListener('click', function() {
            window.location.href = 'profile.html';
        });
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            auth.signOut();
        });
    }

    const initialMode = new URLSearchParams(window.location.search).get('mode') === 'register' ? 'register' : 'login';
    setAuthMode(initialMode);

    auth.onAuthStateChanged(user => {
        updateUserStatus(user);
        if (window.onAuthStateChanged) {
            window.onAuthStateChanged(user);
        }
    });

    window.openAuthForm = openAuthForm;
})();