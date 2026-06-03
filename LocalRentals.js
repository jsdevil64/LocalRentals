const expertGrid = document.getElementById('experts-grid');
const openFormBtn = document.getElementById('open-form-btn');
const registerModal = document.getElementById('register-modal');
const closeRegBtn = document.getElementById('close-reg-btn');
const closeRevBtn = document.getElementById('close-rev-btn');
const expertForm = document.getElementById('expert-form');
const resultsCount = document.getElementById('results-count');

const reviewModal = document.getElementById('review-modal');
const reviewForm = document.getElementById('review-form');
const modalReviewsList = document.getElementById('modal-reviews-list');
const modalReviewCount = document.getElementById('modal-review-count');

const ownerLoginBtn = document.getElementById('owner-login-btn');
const ownerLogoutBtn = document.getElementById('owner-logout-btn');
const adminStatusBar = document.getElementById('admin-status-bar');

const searchBtn = document.getElementById('search-btn');
const areaSearch = document.getElementById('area-search');
const serviceFilter = document.getElementById('service-filter');
const chips = document.querySelectorAll('.chip');

let experts = [];
let activeExpertId = null; 
let isOwnerLoggedIn = false; 

function sortExpertsData(array) {
    return array.sort((a, b) => {
        if (a.isPremium && !b.isPremium) return -1;
        if (!a.isPremium && b.isPremium) return 1;
        return parseFloat(b.rating) - parseFloat(a.rating);
    });
}

function renderExperts(dataToRender = experts) {
    expertGrid.innerHTML = '';
    const sortedData = sortExpertsData([...dataToRender]);
    resultsCount.textContent = `${sortedData.length} பதிவுகள் உள்ளன`;

    if(sortedData.length === 0) {
        expertGrid.innerHTML = `
            <div style="text-align:center; padding:40px; color:#64748B; grid-column: 1/-1;">
                <i class="fa-solid fa-boxes-empty" style="font-size:40px; margin-bottom:10px; color:#cbd5e1;"></i>
                <p>இந்த ஏரியாவில் வாடகை பொருட்கள் எதுவும் இன்னும் பதிவு செய்யப்படவில்லை!</p>
            </div>`;
        return;
    }

    sortedData.forEach(expert => {
        const card = document.createElement('div');
        card.classList.add('expert-card');
        
        if (expert.isPremium) card.classList.add('premium-active');
        
        const isBadRating = parseFloat(expert.rating) <= 3.0;
        if (isOwnerLoggedIn && isBadRating && !expert.isPremium) {
            card.classList.add('bad-review-alert');
        }
        
        // HEAVY MACHINERY SPECIFIC RENTAL ICONS 
        let avatarHTML = '';
        if (expert.image) {
            avatarHTML = `<img src="${expert.image}" alt="${expert.name}" class="avatar-image">`;
        } else {
            let iconClass = 'fa-shuttle-space'; // mixer
            if (expert.prof === 'lift') iconClass = 'fa-arrow-up-from-ground-water';
            if (expert.prof === 'generator') iconClass = 'fa-charging-station';
            if (expert.prof === 'sound') iconClass = 'fa-volume-high';
            if (expert.prof === 'tents') iconClass = 'fa-campground';
            avatarHTML = `<div class="avatar-container"><i class="fa-solid ${iconClass}"></i></div>`;
        }
        
        let tagHTML = '';
        if (expert.isPremium) {
            tagHTML = `<span class="premium-tag"><i class="fa-solid fa-crown"></i> Verified Owner</span>`;
        } else if (isOwnerLoggedIn && isBadRating) {
            tagHTML = `<span class="bad-review-tag"><i class="fa-solid fa-triangle-exclamation"></i> Low Rating</span>`;
        }
        
        let ownerActionsHTML = '';
        if (isOwnerLoggedIn) {
            const premBtnText = expert.isPremium ? 'Remove Premium' : 'Make Premium';
            const premClass = expert.isPremium ? 'premium-toggle-btn is-prem' : 'premium-toggle-btn';
            ownerActionsHTML = `
                <button class="${premClass}" onclick="togglePremiumStatus('${expert.id}')">${premBtnText}</button>
                <button class="delete-btn" onclick="deleteExpertProfile('${expert.id}')"><i class="fa-solid fa-trash-can"></i></button>
            `;
        }
        
        card.innerHTML = `
            ${tagHTML}
            <div class="card-left" onclick="openReviewSystem('${expert.id}')">
                ${avatarHTML}
                <div class="expert-info">
                    <span class="badge">${getProfTamil(expert.prof)}</span>
                    <h4>${expert.name}</h4>
                    <p class="expert-loc"><i class="fa-solid fa-location-dot"></i> ${expert.location}</p>
                    <div class="rating-badge"><i class="fa-solid fa-star"></i> <span>${expert.rating}</span></div>
                </div>
            </div>
            <div class="card-right-actions">
                <div class="action-buttons-row">
                    <a href="tel:${expert.phone}" class="call-btn-link"><i class="fa-solid fa-phone"></i></a>
                    ${ownerActionsHTML}
                </div>
            </div>
        `;
        expertGrid.appendChild(card);
    });
}

function getProfTamil(prof) {
    if(prof === 'mixer') return 'கான்கிரீட் மிக்ஸர்';
    if(prof === 'lift') return 'கன்ஸ்ட்ரக்ஷன் லிஃப்ட்';
    if(prof === 'generator') return 'ஜெனரேட்டர் ரெண்டல்';
    if(prof === 'sound') return 'சவுண்ட் & மைக் செட்';
    if(prof === 'tents') return 'பந்தல் & சேர்ஸ்';
    return prof;
}

window.togglePremiumStatus = function(id) {
    const expert = experts.find(e => e.id === id);
    if (expert) {
        expert.isPremium = !expert.isPremium;
        handleSearch();
    }
}

ownerLoginBtn.addEventListener('click', () => {
    const password = prompt("பாஸ்வேர்ட் அடிக்கவும்:");
    if (password === "admin123") {
        isOwnerLoggedIn = true;
        adminStatusBar.style.display = 'flex';
        ownerLoginBtn.style.display = 'none';
        handleSearch();
        alert("Owner Mode Active!");
    } else {
        alert("தவறான பாஸ்வேர்ட்!");
    }
});

ownerLogoutBtn.addEventListener('click', () => {
    isOwnerLoggedIn = false;
    adminStatusBar.style.display = 'none';
    ownerLoginBtn.style.display = 'flex';
    handleSearch();
});

window.deleteExpertProfile = function(id) {
    if (confirm("நிச்சயமாக நீக்க வேண்டுமா?")) {
        experts = experts.filter(e => e.id !== id);
        handleSearch();
    }
}

window.openReviewSystem = function(id) {
    const expert = experts.find(e => e.id === id);
    if (!expert) return;

    activeExpertId = id;
    document.getElementById('modal-expert-name').textContent = expert.name;
    document.getElementById('modal-expert-prof').textContent = getProfTamil(expert.prof);
    document.getElementById('modal-expert-loc').innerHTML = `<i class="fa-solid fa-location-dot"></i> ${expert.location}`;
    
    const avatarDiv = document.getElementById('modal-expert-avatar');
    if (expert.image) {
        avatarDiv.innerHTML = `<img src="${expert.image}" class="avatar-image">`;
    } else {
        let iconClass = 'fa-shuttle-space';
        if (expert.prof === 'lift') iconClass = 'fa-arrow-up-from-ground-water';
        if (expert.prof === 'generator') iconClass = 'fa-charging-station';
        if (expert.prof === 'sound') iconClass = 'fa-volume-high';
        if (expert.prof === 'tents') iconClass = 'fa-campground';
        avatarDiv.innerHTML = `<div class="avatar-container" style="margin-bottom:0;"><i class="fa-solid ${iconClass}"></i></div>`;
    }

    renderReviewsList(expert);
    reviewModal.style.display = 'flex';
}

function renderReviewsList(expert) {
    modalReviewsList.innerHTML = '';
    modalReviewCount.textContent = expert.reviews.length;

    if (expert.reviews.length === 0) {
        modalReviewsList.innerHTML = `<p style="font-size:12px; color:#64748B; text-align:center; padding:10px;">மதிப்புரைகள் எதுவும் இல்லை.</p>`;
        return;
    }

    expert.reviews.forEach(rev => {
        const revCard = document.createElement('div');
        revCard.classList.add('single-review-card');
        let stars = '⭐'.repeat(rev.stars);
        revCard.innerHTML = `<div class="review-stars">${stars}</div><p class="review-comment">${rev.text}</p>`;
        modalReviewsList.appendChild(revCard);
    });
}

reviewForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const ratingSelect = document.getElementById('review-rating').value;
    const reviewText = document.getElementById('review-text').value;

    const expert = experts.find(e => e.id === activeExpertId);
    if (expert) {
        expert.reviews.unshift({ stars: parseInt(ratingSelect), text: reviewText });
        const totalStars = expert.reviews.reduce((sum, r) => sum + r.stars, 0);
        expert.rating = (totalStars / expert.reviews.length).toFixed(1);
        renderReviewsList(expert);
        handleSearch();
        reviewForm.reset();
    }
});

function handleSearch() {
    const searchText = areaSearch.value.toLowerCase().trim();
    const selectedService = serviceFilter.value;

    const filtered = experts.filter(expert => {
        const matchesLocation = expert.location.toLowerCase().includes(searchText);
        const matchesService = (selectedService === 'all') || (expert.prof === selectedService);
        return matchesLocation && matchesService;
    });
    renderExperts(filtered);
}

chips.forEach(chip => {
    chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        serviceFilter.value = chip.getAttribute('data-filter');
        handleSearch();
    });
});

searchBtn.addEventListener('click', handleSearch);
areaSearch.addEventListener('keyup', (e) => { if(e.key === 'Enter') handleSearch(); });
openFormBtn.addEventListener('click', () => { registerModal.style.display = 'flex'; });
closeRegBtn.addEventListener('click', () => { registerModal.style.display = 'none'; });
closeRevBtn.addEventListener('click', () => { reviewModal.style.display = 'none'; });

expertForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('profile-pic');
    const file = fileInput.files[0];
    
    const saveExpert = (imageSrc = null) => {
        const newExpert = {
            id: Date.now().toString(),
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            prof: document.getElementById('prof').value,
            location: document.getElementById('location').value,
            rating: "5.0",
            image: imageSrc,
            isPremium: false,
            reviews: []
        };
        experts.unshift(newExpert);
        handleSearch();
        registerModal.style.display = 'none';
        expertForm.reset();
    };

    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) { saveExpert(event.target.result); };
        reader.readAsDataURL(file);
    } else {
        saveExpert(null);
    }
});

handleSearch();


