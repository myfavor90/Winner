let currentUser = null;
let currentService = null;

// Check authentication
firebase.auth().onAuthStateChanged((user) => {
    if (!user && !window.location.pathname.includes('index.html')) {
        window.location.href = 'index.html';
    } else if (user) {
        currentUser = user;
        loadUserData();
        loadTransactions();
    }
});

async function loadUserData() {
    try {
        const userDoc = await firebase.firestore().collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            document.getElementById('userBalance').textContent = userData.balance || 0;
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

async function loadTransactions() {
    try {
        const userDoc = await firebase.firestore().collection('users').doc(currentUser.uid).get();
        const transactions = userDoc.data()?.transactions || [];
        
        const transactionList = document.getElementById('transactionList');
        if (transactions.length === 0) {
            transactionList.innerHTML = '<p style="text-align: center; color: #666;">No transactions yet</p>';
            return;
        }
        
        transactionList.innerHTML = transactions.reverse().map(trans => `
            <div class="transaction-item">
                <div class="transaction-details">
                    <div class="transaction-type">${trans.service} - ${trans.details}</div>
                    <div class="transaction-date">${new Date(trans.date).toLocaleString()}</div>
                </div>
                <div class="transaction-amount ${trans.status === 'success' ? 'amount-success' : 'amount-pending'}">
                    -₦${trans.amount}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

function showPurchaseModal(service) {
    currentService = service;
    const modal = document.getElementById('purchaseModal');
    const modalTitle = document.getElementById('modalTitle');
    const networkSelect = document.getElementById('networkSelect');
    const phoneInput = document.getElementById('phoneInput');
    const amountInput = document.getElementById('amountInput');
    
    // Reset form
    phoneInput.value = '';
    amountInput.value = '';
    
    switch(service) {
        case 'airtime':
            modalTitle.textContent = 'Buy Airtime';
            networkSelect.style.display = 'block';
            phoneInput.placeholder = 'Phone Number';
            break;
        case 'data':
            modalTitle.textContent = 'Buy Data Bundle';
            networkSelect.style.display = 'block';
            phoneInput.placeholder = 'Phone Number';
            break;
        case 'electricity':
            modalTitle.textContent = 'Pay Electricity Bill';
            networkSelect.style.display = 'none';
            phoneInput.placeholder = 'Meter Number';
            break;
        case 'cable':
            modalTitle.textContent = 'Pay Cable TV';
            networkSelect.style.display = 'block';
            phoneInput.placeholder = 'Smart Card Number';
            break;
    }
    
    modal.style.display = 'flex';
}

async function confirmPurchase() {
    const amount = parseFloat(document.getElementById('amountInput').value);
    const phoneOrMeter = document.getElementById('phoneInput').value;
    const network = document.getElementById('networkSelect').value;
    
    if (!amount || amount <= 0) {
        showNotification('Please enter a valid amount', 'error');
        return;
    }
    
    if (!phoneOrMeter) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (currentService !== 'electricity' && !network) {
        showNotification('Please select a network', 'error');
        return;
    }
    
    // Check balance
    const userDoc = await firebase.firestore().collection('users').doc(currentUser.uid).get();
    const currentBalance = userDoc.data()?.balance || 0;
    
    if (currentBalance < amount) {
        showNotification('Insufficient balance. Please fund your wallet.', 'error');
        return;
    }
    
    // Process purchase
    try {
        // Deduct balance
        const newBalance = currentBalance - amount;
        
        // Add transaction record
        const transaction = {
            service: currentService,
            amount: amount,
            details: `${network ? network.toUpperCase() + ' - ' : ''}${phoneOrMeter}`,
            date: new Date().toISOString(),
            status: 'success'
        };
        
        // Update Firestore
        await firebase.firestore().collection('users').doc(currentUser.uid).update({
            balance: newBalance,
            transactions: firebase.firestore.FieldValue.arrayUnion(transaction)
        });
        
        // Update UI
        document.getElementById('userBalance').textContent = newBalance;
        showNotification('Purchase successful!', 'success');
        closeModal();
        loadTransactions();
        
        // Optional: Call API to process actual VTU purchase
        await processVTUPurchase(currentService, network, phoneOrMeter, amount);
        
    } catch (error) {
        console.error('Purchase error:', error);
        showNotification('Purchase failed. Please try again.', 'error');
    }
}

async function processVTUPurchase(service, network, phone, amount) {
    // This is where you'd connect to a real VTU API
    // Example: You can use Vercel Serverless Function
    try {
        const response = await fetch('/api/vtu', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                service,
                network,
                phone,
                amount,
                userId: currentUser.uid
            })
        });
        
        const data = await response.json();
        console.log('API Response:', data);
    } catch (error) {
        console.error('API Error:', error);
    }
}

function closeModal() {
    document.getElementById('purchaseModal').style.display = 'none';
}

function logout() {
    firebase.auth().signOut().then(() => {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    });
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('purchaseModal');
    if (event.target === modal) {
        closeModal();
    }
}
