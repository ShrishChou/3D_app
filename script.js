import * as THREE from 'https://unpkg.com/three@0.166.1/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.166.1/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://unpkg.com/three@0.166.1/examples/jsm/controls/OrbitControls.js';

// --- STATE & DATA ---
const shoppingCart = []; 
let itemToAdd = null; 
let firstInteraction = true;

const outfitMeshes = {
    tops: {},
    pants: {},
    shoes: { group_orange: [], group_white: [], group_black: [] },
    scarf: null
};

let mixer;
const animationActions = { wave: null, pose: null, unpose: null };
let lastAction;

let tankTopMaterial, originalTankTopColor;
let dressMaterial, originalDressColor, originalDressMap;

const currentSelections = {
    'GEO-rain-top': { name: 'Default', hex: '#808080' },
    'GEO-rain-top2': { name: 'Default', hex: 'reset' }
};
// Near the top with other data constants
const recommendationsData = [
    {
        id: 'rec1',
        name: "Jessica's Pick",
        pfp: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500', // Placeholder image
        rating: 5,
        outfit: {
            top: 'GEO-rain-top', // Grey Tank Top
            pants: 'GEO-rain-jeans2', // Slim Fit Jeans
            shoes: 'group_white', // White Vans
            topColor: { name: 'Pink', hex: '#e895b2' }
        }
    },
    {
        id: 'rec2',
        name: "Mike's Style",
        pfp: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500', // Placeholder image
        rating: 4,
        outfit: {
            top: 'GEO-rain-top', // Grey Tank Top
            pants: 'GEO-rain-jeans', // Black Leggings
            shoes: 'group_black', // Knit Athletic Shoes
            topColor: { name: 'Black', hex: '#333333' }
        }
    },
    {
        id: 'rec3',
        name: 'Summer Vibe',
        pfp: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500', // Placeholder image
        rating: 5,
        outfit: {
            top: 'GEO-rain-top2', // Sleeveless Dress
            pants: 'GEO-rain-jeans2', // Will be hidden by dress
            shoes: 'group_orange', // Orange Sneakers
            topColor: { name: 'Yellow', hex: '#f0ad4e' }
        }
    }
];
const clothingData = {
  tops: [
    { id: 'top1', name: 'Grey Tank Top', modelId: 'GEO-rain-top', image: 'https://i.ebayimg.com/images/g/qRQAAOSwJ4hY9t~C/s-l1600.jpg', link: 'https://www.ebay.com/itm/161624525769', price: 24.99, colors: [
        { name: 'Default', hex: '#808080' }, { name: 'Red', hex: '#d9534f' }, { name: 'Blue', hex: '#428bca' }, { name: 'Black', hex: '#333333' }, { name: 'Pink', hex: '#e895b2' }
    ]},
    { id: 'top2', name: 'Sleeveless Dress', modelId: 'GEO-rain-top2', image: 'https://i.ebayimg.com/images/g/E0oAAOSwsq9gWe58/s-l1600.jpg', link: 'https://www.ebay.com/itm/114737999403', price: 49.99, colors: [
        { name: 'Default', hex: 'reset' }, { name: 'Red', hex: '#d9534f' }, { name: 'Green', hex: '#5cb85c' }, { name: 'Blue', hex: '#428bca' }, { name: 'Yellow', hex: '#f0ad4e' }
    ]},
  ],
  pants: [
    { id: 'pants1', name: 'Black Leggings', modelId: 'GEO-rain-jeans', image: 'https://i.ebayimg.com/images/g/LyUAAOSw6YxiSA05/s-l1600.jpg', link: 'https://www.ebay.com/itm/334051769364', price: 34.50, colors: []},
    { id: 'pants2', name: 'Slim Fit Jeans', modelId: 'GEO-rain-jeans2', image: 'https://i.ebayimg.com/images/g/YDkAAOSwP-Bn5VYx/s-l1600.jpg', link: 'https://www.ebay.com/itm/167486181512', price: 55.00, colors: []}
  ],
  shoes: [
    { id: 'shoes1', name: 'Orange Sneakers', modelId: 'group_orange', image: 'https://i.ebayimg.com/images/g/AG0AAOSwiLdkLDgc/s-l1600.jpg', link: 'https://www.ebay.com/itm/364206183317', price: 79.99, colors: []},
    { id: 'shoes2', name: 'White Vans', modelId: 'group_white', image: 'https://i.ebayimg.com/images/g/m44AAOSwZ0Fn0h0n/s-l1600.jpg', link: 'https://www.ebay.com/itm/226643693968', price: 65.00, colors: []},
    { id: 'shoes3', name: 'Knit Athletic Shoes', modelId: 'group_black', image: 'shoe.png', link: 'https://www.ebay.com/itm/376356969350', price: 89.95, colors: []}
  ]
};

// --- DOM Elements ---
const initialSearchOverlay = document.getElementById('initial-search-overlay');
const profileDropdown = document.getElementById('profile-dropdown');
const selectedText = profileDropdown.querySelector('.selected-text');
const dropdownOptions = profileDropdown.querySelector('.dropdown-options');
const loadingOverlay = document.getElementById('loading-overlay');
const mainView = document.getElementById('main-view');
const dressCustomizationContainer = document.getElementById('customization-container');
const tankCustomizationContainer = document.getElementById('customization-container-tank');
const checkoutOverlay = document.getElementById('checkout-overlay');
const itemDrawer = document.getElementById('item-drawer');
const chatPanel = document.getElementById('chat-panel');
const bagCount = document.getElementById('bag-count');
const searchVibeBtn = document.getElementById('search-vibe-btn');
const normalShoppingBtn = document.getElementById('normal-shopping-btn');

// --- 3D Scene Setup ---
let scene, camera, renderer, controls, clock;

// --- MODIFIED: Application Startup Logic ---
function startApp() {
    // 1. Hide the initial search screen
    initialSearchOverlay.style.opacity = '0';
    initialSearchOverlay.style.visibility = 'hidden';

    // 2. Show the loading screen
    loadingOverlay.style.display = 'flex';
    setTimeout(() => { 
        loadingOverlay.style.opacity = '1';
    }, 10);

    // 3. Load the 3D model and initialize the rest of the app
    initialize3DScene();
    gltfLoader.load('rain_v3.2.glb', (gltf) => {
        const model = gltf.scene;
        model.traverse((object) => {
            if (object.isMesh) {
                object.castShadow = true;
                let isClothing = false;
                if (['GEO-rain-top', 'GEO-rain-top2'].includes(object.name)) {
                    outfitMeshes.tops[object.name] = object; isClothing = true;
                    if (object.material) object.material.color.set(0x808080);
                    if (object.name === 'GEO-rain-top') { tankTopMaterial = object.material; originalTankTopColor = object.material.color.clone(); }
                    if (object.name === 'GEO-rain-top2') { object.position.y += 0.001; object.position.z -= 0.045; dressMaterial = object.material; originalDressColor = object.material.color.clone(); originalDressMap = object.material.map; }
                }
                else if (['GEO-rain-jeans', 'GEO-rain-jeans2'].includes(object.name)) { outfitMeshes.pants[object.name] = object; isClothing = true; }
                else if (object.name.startsWith('GEO-rain-shoes_')) { outfitMeshes.shoes.group_orange.push(object); isClothing = true; }
                else if (object.name === 'GEO-rain-shoes001') { outfitMeshes.shoes.group_white.push(object); isClothing = true; }
                else if (object.name.startsWith('GEO-rain-shoes002_')) { outfitMeshes.shoes.group_black.push(object); isClothing = true; }
                else if (object.name === 'GEO-rain-scarf') { outfitMeshes.scarf = object; isClothing = true; }
                if (isClothing) object.visible = false;
            }
        });
        
        outfitMeshes.tops['GEO-rain-top'].visible = true;
        outfitMeshes.pants['GEO-rain-jeans2'].visible = true;
        outfitMeshes.shoes.group_orange.forEach(mesh => mesh.visible = true);
        if(tankTopMaterial) tankTopMaterial.color.set(0xffffff);
        scene.add(model);
        
        mixer = new THREE.AnimationMixer(model);
        const waveClip = THREE.AnimationClip.findByName(gltf.animations, 'wave');
        const poseClip = THREE.AnimationClip.findByName(gltf.animations, 'pose');
        const unposeClip = THREE.AnimationClip.findByName(gltf.animations, 'unpose');
        if (waveClip) { 
            animationActions.wave = mixer.clipAction(waveClip); 
            animationActions.wave.setLoop(THREE.LoopOnce); 
            animationActions.wave.clampWhenFinished = true; 
            animationActions.wave.play();
        }
        if (poseClip) { animationActions.pose = mixer.clipAction(poseClip); animationActions.pose.setLoop(THREE.LoopOnce); animationActions.pose.clampWhenFinished = true; }
        if (unposeClip) { animationActions.unpose = mixer.clipAction(unposeClip); animationActions.unpose.setLoop(THREE.LoopOnce); animationActions.unpose.clampWhenFinished = true; }
        
        setupAnimationControls();
        setupDressCustomizationListeners();
        setupTankTopCustomizationListeners();
        document.getElementById('add-outfit-btn').addEventListener('click', addCurrentOutfitToCart);

        // Hide loading overlay
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 500);
    });
    
    // Initialize non-3D UI parts
    setupModal();
    setupMobileUI();
    setupCarousels();
    setupCheckoutListeners();
}

// NEW: Function for "Normal Shopping" flow
function startNormalShopping() {
    // 1. Hide the initial search screen
    initialSearchOverlay.style.opacity = '0';
    initialSearchOverlay.style.visibility = 'hidden';

    // 2. Hide the interactive UI panels
    document.getElementById('ui-panel-container').style.display = 'none';
    document.getElementById('bottom-nav').style.display = 'none';
    
    // 3. Set main view to be full screen with static background
    mainView.classList.add('static-background');
    mainView.style.height = '100%';
    
    // 4. Hide all 3D-specific controls
    document.getElementById('animation-icon-controls').style.display = 'none';
    document.getElementById('add-outfit-btn').style.display = 'none';
}

// --- MODIFIED: Event Listeners for Initial Screen ---
searchVibeBtn.addEventListener('click', startApp);
normalShoppingBtn.addEventListener('click', startNormalShopping);

profileDropdown.addEventListener('click', (event) => {
    event.stopPropagation();
    profileDropdown.classList.toggle('active');
    dropdownOptions.style.display = dropdownOptions.style.display === 'block' ? 'none' : 'block';
});

document.querySelectorAll('.dropdown-option').forEach(option => {
    option.addEventListener('click', () => {
        const memoji = option.querySelector('.memoji').textContent;
        selectedText.innerHTML = `<span class="memoji">${memoji}</span>`;
    });
});

window.addEventListener('click', () => {
    if (profileDropdown.classList.contains('active')) {
        profileDropdown.classList.remove('active');
        dropdownOptions.style.display = 'none';
    }
});

// --- NEW: 3D Scene Initialization ---
const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();
const newFlowerDataURL = "flowers.png";
const checkeredDressPreviewImage = "checkered.png";

function initialize3DScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f2f5);
    camera = new THREE.PerspectiveCamera(75, mainView.clientWidth / mainView.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 1.8);
    
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.setSize(mainView.clientWidth, mainView.clientHeight);
    mainView.insertBefore(renderer.domElement, mainView.firstChild);
    
    scene.add(new THREE.AmbientLight(0xffffff, 0.7)); 
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(5, 10, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshStandardMaterial({ color: 0xf0f2f5 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.0, 0);
    controls.enableDamping = true;

    clock = new THREE.Clock();

    const resizeObserver = new ResizeObserver(entries => {
        if (!renderer) return;
        const { width, height } = entries[0].contentRect;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });
    resizeObserver.observe(mainView);

    animate();
}

// --- Modal Setup ---
function setupModal() {
    const modalHTML = `
        <div id="quantity-modal" style="display: none; position: fixed; z-index: 3000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.5); justify-content: center; align-items: center;">
            <div style="background-color: #fff; padding: 25px; border-radius: 12px; width: 90%; max-width: 320px; text-align: center; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
                <h3 id="modal-item-name" style="margin-top: 0; font-size: 16px;">Item Name</h3>
                <p style="font-size: 14px;">Color: <span id="modal-item-color">Color</span></p>
                <div style="margin: 20px 0;">
                    <label for="quantity-input" style="margin-right: 10px; font-size: 14px;">Quantity:</label>
                    <input type="number" id="quantity-input" value="1" min="1" style="width: 60px; padding: 5px; border-radius: 5px; border: 1px solid #ccc;">
                </div>
                <div style="display: flex; justify-content: space-around;">
                    <button id="confirm-add-to-cart" class="carousel-btn try-on-btn">Confirm</button>
                    <button id="cancel-add-to-cart" class="carousel-btn view-listing-btn">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('cancel-add-to-cart').addEventListener('click', () => {
        document.getElementById('quantity-modal').style.display = 'none';
    });

    document.getElementById('confirm-add-to-cart').addEventListener('click', confirmAddToCart);
}

// --- Mobile UI & Nav ---
function setupMobileUI() {
    const navItemsBtn = document.getElementById('nav-items-btn');
    const navChatBtn = document.getElementById('nav-chat-btn');
    const navBagBtn = document.getElementById('nav-bag-btn');
    const closeChatBtn = document.getElementById('close-chat-btn');
    const allNavButtons = [navItemsBtn, navChatBtn, navBagBtn];

    // MODIFIED: Start with shop panel open
    itemDrawer.style.display = 'flex';
    chatPanel.style.display = 'none';

    navItemsBtn.addEventListener('click', () => {
        itemDrawer.style.display = 'flex';
        chatPanel.style.display = 'none';
        allNavButtons.forEach(btn => btn.classList.remove('active'));
        navItemsBtn.classList.add('active');
    });

    navChatBtn.addEventListener('click', () => {
        chatPanel.style.display = 'flex';
        itemDrawer.style.display = 'none';
        allNavButtons.forEach(btn => btn.classList.remove('active'));
        navChatBtn.classList.add('active');
    });

    closeChatBtn.addEventListener('click', () => {
        navItemsBtn.click();
    });
    
    navBagBtn.addEventListener('click', () => {
        if (shoppingCart.length > 0) {
            showCheckoutScreen();
        } else {
            addBotMessage("Your bag is empty. Add some items first!");
            navChatBtn.click();
        }
    });

    document.querySelectorAll('.item-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.item-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.carousel-container').forEach(c => c.classList.remove('active'));
            const category = e.target.dataset.category;
            document.getElementById(`${category}-carousel-container`).classList.add('active');
        });
    });
}

function playAnimation(actionToPlay) { if (!actionToPlay) return; const currentAction = lastAction; lastAction = actionToPlay; if (currentAction && currentAction !== actionToPlay) currentAction.fadeOut(0.5); actionToPlay.reset().fadeIn(0.5).play(); }

function setupAnimationControls() {
    document.getElementById('play-wave-animation').addEventListener('click', () => playAnimation(animationActions.wave));
    document.getElementById('play-pose-animation').addEventListener('click', () => playAnimation(animationActions.pose)); 
    document.getElementById('play-unpose-animation').addEventListener('click', () => playAnimation(animationActions.unpose));
}

function setupTankTopCustomizationListeners() { 
    document.querySelectorAll('#customization-container-tank .swatch').forEach(swatch => swatch.addEventListener('click', (e) => { 
        const colorHex = e.target.dataset.lightColor;
        const colorName = e.target.title;
        if (!tankTopMaterial || !colorHex) return; 
        if (colorHex === 'reset') {
            tankTopMaterial.color.copy(originalTankTopColor); 
            currentSelections['GEO-rain-top'] = { name: 'Default', hex: '#808080' };
        } else {
            tankTopMaterial.color.set(colorHex); 
            currentSelections['GEO-rain-top'] = { name: colorName, hex: colorHex };
        }
        tankTopMaterial.needsUpdate = true; 
    })); 
}

function setupDressCustomizationListeners() { 
    document.querySelectorAll('#customization-container .swatch').forEach(swatch => swatch.addEventListener('click', (e) => { 
        const colorHex = e.target.dataset.lightColor; 
        const colorName = e.target.title;
        if (!dressMaterial || !colorHex) return; 
        dressMaterial.map = originalDressMap; 
        if (colorHex === 'reset') {
            dressMaterial.color.copy(originalDressColor); 
            currentSelections['GEO-rain-top2'] = { name: 'Default', hex: 'reset' };
        } else {
            dressMaterial.color.set(colorHex); 
            currentSelections['GEO-rain-top2'] = { name: colorName, hex: colorHex };
        }
        dressMaterial.needsUpdate = true; 
        const originalDressData = clothingData.tops[1]; 
        const dressImage = document.querySelector('#tops-carousel-container .carousel-item:nth-child(2) img'); 
        if (dressImage) dressImage.src = originalDressData.image; 
    })); 
    
    document.getElementById('apply-checkered-pattern').addEventListener('click', () => { 
        if (!dressMaterial) return; 
        textureLoader.load(newFlowerDataURL, (texture) => { 
            texture.wrapS = THREE.RepeatWrapping; 
            texture.wrapT = THREE.RepeatWrapping; 
            texture.repeat.set(5, 5); 
            texture.needsUpdate = true; 
            dressMaterial.map = texture; 
            dressMaterial.color.set(0xffffff); 
            dressMaterial.needsUpdate = true; 
            currentSelections['GEO-rain-top2'] = { name: 'Checkered', hex: 'texture' };
            const dressImage = document.querySelector('#tops-carousel-container .carousel-item:nth-child(2) img'); 
            if (dressImage) dressImage.src = checkeredDressPreviewImage; 
        }, undefined, (error) => console.error('An error happened.', error) ); 
    }); 
}

function setupCarousels() { 
    populateCarousel('tops', clothingData.tops); 
    populateCarousel('pants', clothingData.pants); 
    populateCarousel('shoes', clothingData.shoes); 
    populateRecsPage();
}

// Add this new function to script.js
function showToast(message) {
    const container = document.getElementById('toast-notification-container');

    // Create the toast element
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;

    // Add to the DOM
    container.appendChild(toast);

    // Animate in
    // A tiny delay is needed for the CSS animation to trigger correctly
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Set timers to remove the toast
    // Start hiding after 2.5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
    }, 2500);

    // Remove from DOM after animation finishes (400ms animation + 2500ms wait)
    setTimeout(() => {
        toast.remove();
    }, 2900);
}

function populateCarousel(category, items) { 
    const content = document.querySelector(`#${category}-carousel-container .carousel-content`); 
    content.innerHTML = items.map(item => `
        <div class="carousel-item">
            <div class="carousel-item-image-wrapper">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <h3>${item.name}</h3>
            <p class="carousel-item-price">$${item.price.toFixed(2)}</p>
            <div class="carousel-buttons">
                <button class="carousel-btn try-on-btn" data-model-id="${item.modelId}" data-category="${category}">Try On</button>
                <a href="${item.link}" target="_blank" class="carousel-btn view-listing-btn">View</a>
            </div>
            <button class="add-to-cart-btn" data-item-id="${item.id}">+</button>
        </div>
    `).join(''); 
    content.querySelectorAll('.try-on-btn').forEach(btn => btn.addEventListener('click', handleTryOn));
    content.querySelectorAll('.add-to-cart-btn').forEach(btn => btn.addEventListener('click', handleAddToCartClick));
}

function handleTryOn(event) { 
    const { modelId, category } = event.target.dataset; 
    dressCustomizationContainer.style.display = 'none'; 
    tankCustomizationContainer.style.display = 'none'; 
    if (category === 'tops') { 
        if (modelId !== 'GEO-rain-top2' && dressMaterial) { 
            dressMaterial.color.copy(originalDressColor); 
            dressMaterial.map = originalDressMap; 
            dressMaterial.needsUpdate = true; 
        } 
        if (modelId !== 'GEO-rain-top' && tankTopMaterial) { 
            tankTopMaterial.color.copy(originalTankTopColor); 
            tankTopMaterial.needsUpdate = true; 
        } 
        if (modelId === 'GEO-rain-top') tankCustomizationContainer.style.display = 'block'; 
        else if (modelId === 'GEO-rain-top2') dressCustomizationContainer.style.display = 'block'; 
    } 
    const categoryMeshes = outfitMeshes[category]; 
    if (category === 'shoes') Object.values(categoryMeshes).forEach(group => group.forEach(mesh => mesh.visible = false)); 
    else Object.values(categoryMeshes).forEach(mesh => mesh.visible = false); 
    const selectedMeshes = categoryMeshes[modelId]; 
    if (Array.isArray(selectedMeshes)) selectedMeshes.forEach(mesh => mesh.visible = true); 
    else if (selectedMeshes) selectedMeshes.visible = true; 
}

// --- Chat Logic ---
function addUserMessage(text) { const el = document.createElement('div'); el.className = 'chat-message user-message'; el.textContent = text; document.getElementById('chat-log').appendChild(el); document.getElementById('chat-log').scrollTop = document.getElementById('chat-log').scrollHeight; }
function typewriterEffect(element, text) { return new Promise(resolve => { element.innerHTML = ''; let i = 0; const chatLog = document.getElementById('chat-log'); function type() { if (i < text.length) { element.textContent += text.charAt(i); i++; chatLog.scrollTop = chatLog.scrollHeight; setTimeout(type, 35); } else { resolve(); } } type(); }); }
async function addBotMessage(text) { const chatLog = document.getElementById('chat-log'); const el = document.createElement('div'); el.className = 'chat-message bot-message'; el.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>'; chatLog.appendChild(el); chatLog.scrollTop = chatLog.scrollHeight; await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500)); await typewriterEffect(el, text); }

function askForCheckoutConfirmation() {
    const chatLog = document.getElementById('chat-log');
    const el = document.createElement('div'); el.className = 'chat-message bot-message bot-message-with-buttons';
    const text = document.createElement('span'); text.textContent = "Ready to checkout?"; el.appendChild(text);
    const buttonContainer = document.createElement('div'); buttonContainer.className = 'confirmation-buttons';
    const yesBtn = document.createElement('button'); yesBtn.textContent = 'Yes, Checkout'; yesBtn.className = 'carousel-btn try-on-btn';
    yesBtn.onclick = () => { showCheckoutScreen(); el.remove(); };
    const noBtn = document.createElement('button'); noBtn.textContent = 'Not yet'; noBtn.className = 'carousel-btn view-listing-btn';
    noBtn.onclick = () => { el.remove(); };
    buttonContainer.appendChild(yesBtn); buttonContainer.appendChild(noBtn); el.appendChild(buttonContainer);
    chatLog.appendChild(el); chatLog.scrollTop = chatLog.scrollHeight;
}

async function processCommand(text) {
     addUserMessage(text);
     if (firstInteraction) {
         firstInteraction = false;
         await addBotMessage("Searching for clothing items that match your request...");
         setTimeout(() => {
             document.getElementById('nav-items-btn').click();
         }, 1000);
         return;
     }
     if (text.toLowerCase().includes('checkout')) { askForCheckoutConfirmation(); return; }
     if (text.toLowerCase().includes('scarf')) { 
         if (outfitMeshes.scarf) { outfitMeshes.scarf.visible = true; await addBotMessage("I've added the scarf for you!"); } 
         else { await addBotMessage("I couldn't find a scarf right now."); } return; 
     }
     await addBotMessage("You can change the outfit using the 'Shop' tab below!");
}

// --- Checkout & Cart Flow ---
function updateBagCount() {
    const count = shoppingCart.reduce((total, item) => total + item.quantity, 0);
    if (count > 0) {
        bagCount.textContent = count;
        bagCount.style.display = 'flex';
    } else {
        bagCount.style.display = 'none';
    }
}

function handleAddToCartClick(event) {
    const itemId = event.target.dataset.itemId;
    const allClothing = [...clothingData.tops, ...clothingData.pants, ...clothingData.shoes];
    itemToAdd = allClothing.find(item => item.id === itemId);
    if (!itemToAdd) return;
    let selectedColor = { name: 'Standard', hex: null };
    if (itemToAdd.colors.length > 0) {
        selectedColor = currentSelections[itemToAdd.modelId] || itemToAdd.colors[0];
    }
    itemToAdd.selectedColor = selectedColor;
    document.getElementById('modal-item-name').textContent = itemToAdd.name;
    document.getElementById('modal-item-color').textContent = selectedColor.name;
    document.getElementById('quantity-input').value = 1;
    document.getElementById('quantity-modal').style.display = 'flex';
}

// In script.js, find and modify this function
async function confirmAddToCart() {
    const quantity = parseInt(document.getElementById('quantity-input').value, 10);
    if (!itemToAdd || isNaN(quantity) || quantity < 1) return;

    const existingCartItem = shoppingCart.find(
        item => item.id === itemToAdd.id && item.selectedColor.name === itemToAdd.selectedColor.name
    );

    if (existingCartItem) {
        existingCartItem.quantity += quantity;
    } else {
        shoppingCart.push({ ...itemToAdd, quantity: quantity, cartItemId: `${itemToAdd.id}-${itemToAdd.selectedColor.name}-${Date.now()}` });
    }

    document.getElementById('quantity-modal').style.display = 'none';

    // REMOVE these two lines:
    // addBotMessage(`Added ${quantity} x ${itemToAdd.name} (${itemToAdd.selectedColor.name}) to your bag.`);
    // document.getElementById('nav-chat-btn').click();

    // ADD this line:
    showToast(`Added ${itemToAdd.name} to bag`);

    itemToAdd = null;
    updateBagCount();
}

async function addCurrentOutfitToCart() {
    const outfitToAdd = [];
    const allClothingItems = Object.values(clothingData).flat();
    for (const category of ['tops', 'pants', 'shoes']) {
        for (const modelId in outfitMeshes[category]) {
            const meshOrGroup = outfitMeshes[category][modelId];
            const isVisible = Array.isArray(meshOrGroup) ? meshOrGroup[0]?.visible : meshOrGroup?.visible;
            if (isVisible) {
                const itemData = allClothingItems.find(item => item.modelId === modelId);
                if (itemData) {
                    const itemWithDetails = { ...itemData };
                    itemWithDetails.selectedColor = (itemData.colors && itemData.colors.length > 0) ? (currentSelections[itemData.modelId] || itemData.colors[0]) : { name: 'Standard', hex: null };
                    outfitToAdd.push(itemWithDetails);
                }
                break; 
            }
        }
    }
    if (outfitToAdd.length === 0) {
        addBotMessage("The model isn't wearing anything to add!");
        document.getElementById('nav-chat-btn').click();
        return;
    }
    outfitToAdd.forEach(item => {
        const existingCartItem = shoppingCart.find(ci => ci.id === item.id && ci.selectedColor.name === item.selectedColor.name);
        if (existingCartItem) {
            existingCartItem.quantity += 1;
        } else {
            shoppingCart.push({ ...item, quantity: 1, cartItemId: `${item.id}-${item.selectedColor.name}-${Date.now()}` });
        }
    });
    // const itemNames = outfitToAdd.map(item => item.name).join(', ');
    // addBotMessage(`I've added the full outfit (${itemNames}) to your bag.`);
    // document.getElementById('nav-chat-btn').click();
    showToast("Full outfit added to bag");
    updateBagCount();
}

function showCheckoutScreen() {
    document.getElementById('checkout-main').style.display = 'flex';
    document.getElementById('order-success-message').style.display = 'none';
    document.querySelectorAll('#shipping-form input, #payment-form input').forEach(input => {
        input.value = ''; input.style.borderColor = 'var(--border-color)';
    });
    populateCheckoutItems();
    checkoutOverlay.style.display = 'flex';
}

function hideCheckoutScreen() { checkoutOverlay.style.display = 'none'; }

function populateCheckoutItems() {
    const itemsContainer = document.getElementById('checkout-items-container');
    const subtotalEl = document.getElementById('summary-subtotal');
    const taxesEl = document.getElementById('summary-taxes');
    const totalEl = document.getElementById('summary-total');
    itemsContainer.innerHTML = '';
    let subtotal = 0;
    if (shoppingCart.length === 0) {
        itemsContainer.innerHTML = '<p style="padding: 20px; text-align: center; color: var(--secondary-text-color);">Your bag is empty.</p>';
    } else {
        shoppingCart.forEach(item => {
            const itemPriceTotal = item.price * item.quantity;
            subtotal += itemPriceTotal;
            const imageSrc = (item.modelId === 'GEO-rain-top2' && item.selectedColor.name === 'Checkered') ? checkeredDressPreviewImage : item.image;
            let swatchStyle = '';
            const color = item.selectedColor;
            if (color && color.hex) {
                if (color.hex === 'texture') swatchStyle = `background-image: linear-gradient(45deg, #95c2e5 25%, transparent 25%, transparent 75%, #95c2e5 75%, #95c2e5), linear-gradient(45deg, #95c2e5 25%, transparent 25%, transparent 75%, #95c2e5 75%, #95c2e5); background-size: 8px 8px; background-position: 0 0, 4px 4px;`;
                else if (color.hex !== 'reset') swatchStyle = `background-color: ${color.hex};`;
                else swatchStyle = `background-color: #cccccc;`;
            } else { swatchStyle = 'display: none;'; }
            const itemModule = document.createElement('div');
            itemModule.className = 'checkout-item-module';
            itemModule.innerHTML = `<div class="checkout-item-image-container"><img src="${imageSrc}" alt="${item.name}"></div><div class="checkout-item-details"><div class="item-info"><h3>${item.name} (x${item.quantity})</h3><div class="item-colors"><h4>${item.selectedColor.name}</h4><span class="cart-color-swatch" style="${swatchStyle}"></span></div></div><div class="item-selection"><strong style="font-size: 15px;">$${itemPriceTotal.toFixed(2)}</strong><button class="remove-from-cart-btn" data-cart-item-id="${item.cartItemId}" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #d9534f; padding: 0 5px;">&times;</button></div></div>`;
            itemsContainer.appendChild(itemModule);
        });
    }
    const taxes = subtotal * 0.10;
    const total = subtotal + taxes;
    subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    taxesEl.textContent = `$${taxes.toFixed(2)}`;
    totalEl.textContent = `$${total.toFixed(2)}`;
    document.querySelectorAll('.remove-from-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const cartItemIdToRemove = e.target.dataset.cartItemId;
            const itemIndex = shoppingCart.findIndex(item => item.cartItemId === cartItemIdToRemove);
            if (itemIndex > -1) {
                shoppingCart.splice(itemIndex, 1);
                populateCheckoutItems(); 
                updateBagCount();
            }
        });
    });
}
// Add this new function somewhere in your script, e.g., after handleTryOn

function applyRecommendedOutfit(recommendation) { // The parameter is now the full recommendation
    const outfit = recommendation.outfit; // Get the outfit object from the recommendation

    // Hide all customization panels first
    dressCustomizationContainer.style.display = 'none';
    tankCustomizationContainer.style.display = 'none';

    // 1. Apply Top and its color
    Object.values(outfitMeshes.tops).forEach(mesh => mesh.visible = false);
    const topMesh = outfitMeshes.tops[outfit.top];
    if (topMesh) {
        topMesh.visible = true;
        // Handle color application
        if (outfit.topColor) {
            if (outfit.top === 'GEO-rain-top' && tankTopMaterial) {
                tankTopMaterial.color.set(outfit.topColor.hex);
                currentSelections['GEO-rain-top'] = outfit.topColor;
                tankCustomizationContainer.style.display = 'flex';
            } else if (outfit.top === 'GEO-rain-top2' && dressMaterial) {
                dressMaterial.map = originalDressMap;
                dressMaterial.color.set(outfit.topColor.hex);
                currentSelections['GEO-rain-top2'] = outfit.topColor;
                dressCustomizationContainer.style.display = 'flex';
            }
        }
    }

    // 2. Apply Pants
    Object.values(outfitMeshes.pants).forEach(mesh => mesh.visible = false);
    const pantsMesh = outfitMeshes.pants[outfit.pants];
    if (pantsMesh) pantsMesh.visible = true;

    // 3. Apply Shoes
    Object.values(outfitMeshes.shoes).forEach(group => group.forEach(mesh => mesh.visible = false));
    const shoeGroup = outfitMeshes.shoes[outfit.shoes];
    if (shoeGroup) shoeGroup.forEach(mesh => mesh.visible = true);

    // This now correctly accesses the name from the recommendation object
    showToast(`Showing ${recommendation.name}`);
}
// Add these two new functions after the populateCarousel function

function generateStars(rating) {
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            starsHTML += '<span>★</span>'; // Solid star
        } else {
            starsHTML += '<span class="inactive">☆</span>'; // Outline star
        }
    }
    return `<div class="star-rating">${starsHTML}</div>`;
}

function populateRecsPage() {
    const content = document.querySelector('#recs-carousel-container .carousel-content');
    content.innerHTML = recommendationsData.map(rec => `
        <div class="rec-card" data-rec-id="${rec.id}">
            <img src="${rec.pfp}" alt="${rec.name}" class="rec-card-pfp">
            <h3>${rec.name}</h3>
            ${generateStars(rec.rating)}
        </div>
    `).join('');

    // Add event listeners to the new cards
    content.querySelectorAll('.rec-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const recId = e.currentTarget.dataset.recId;
            const recommendation = recommendationsData.find(r => r.id === recId);
            if (recommendation) {
                applyRecommendedOutfit(recommendation);
            }
        });
    });
}

function setupCheckoutListeners() {
    document.getElementById('close-checkout-btn').addEventListener('click', hideCheckoutScreen);
    document.getElementById('place-order-btn').addEventListener('click', () => {
        const requiredFields = document.querySelectorAll('#shipping-form input[required], #payment-form input[required]');
        let allValid = true;
        requiredFields.forEach(input => {
            if (!input.value.trim()) { input.style.borderColor = 'red'; allValid = false; } else { input.style.borderColor = 'var(--border-color)'; }
        });
        if (!allValid) { alert('Please fill out all required shipping and payment fields.'); return; }
        if (shoppingCart.length === 0) { alert('Your bag is empty! Add some items before checking out.'); return; }
        document.getElementById('checkout-main').style.display = 'none';
        document.getElementById('order-success-message').style.display = 'block';
        shoppingCart.length = 0; 
        updateBagCount();
    });
}

document.getElementById('chat-input').addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && document.getElementById('chat-input').value.trim() !== '') {
         processCommand(document.getElementById('chat-input').value);
         document.getElementById('chat-input').value = '';
    }
});

// --- Render Loop & Resize Observer ---
function animate() {
    if (!renderer) return; // Stop the loop if 3D scene isn't initialized
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    if (controls) controls.update();
    if (renderer) renderer.render(scene, camera);
}