(function() {
    const firebaseConfig = {
        apiKey : "AIzaSyCZn5vuwwmSuuu_cjE_z-6ZDAiN_pOj3wo" , 
        authDomain : "find-job-b4311.firebaseapp.com" , 
        projectId : "find-job-b4311" , 
        storageBucket : "find-job-b4311.firebasestorage.app" , 
        messagingSenderId : "34102923819" , 
        appId : "1:34102923819:web:a625c25514df9619e5106e" , 
        measurementId : "G-RGRJ8V33KM" 
    };

    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();

    const profileEmail = document.getElementById('profileEmail');
    const profileName = document.getElementById('profileName');
    const profileUid = document.getElementById('profileUid');
    const profileLastLogin = document.getElementById('profileLastLogin');
    const logoutBtn = document.getElementById('logoutBtn');
    const backHomeBtn = document.getElementById('backHomeBtn');

    function displayUser(user) {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }

        profileEmail.textContent = user.email || 'Không có';
        profileName.textContent = user.displayName || 'Chưa cập nhật';
        profileUid.textContent = user.uid;
        profileLastLogin.textContent = user.metadata.lastSignInTime || 'Không xác định';
    }

    auth.onAuthStateChanged(user => {
        displayUser(user);
    });

    logoutBtn.addEventListener('click', function() {
        auth.signOut().then(() => {
            window.location.href = 'index.html';
        });
    });

    backHomeBtn.addEventListener('click', function() {
        window.location.href = 'index.html';
    });
})();