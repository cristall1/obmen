const API_URL = '/api';

export async function createOrder(orderData: any) {
    const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
    });
    if (!response.ok) throw new Error('Failed to create order');
    return response.json();
}

export async function createPost(postData: any) {
    const response = await fetch(`${API_URL}/market`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
    });
    if (!response.ok) throw new Error('Failed to create post');
    return response.json();
}

export async function getMarketPosts() {
    const response = await fetch(`${API_URL}/market`);
    if (!response.ok) throw new Error('Failed to fetch posts');
    return response.json();
}

export async function generateVerificationCode(phone: string, userId: number, username?: string, name?: string) {
    const response = await fetch(`${API_URL}/auth/generate-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, user_id: userId, username, name }),
    });
    if (!response.ok) throw new Error('Failed to generate code');
    return response.json();
}

export async function checkVerified(code: string) {
    const response = await fetch(`${API_URL}/auth/check-verified`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
    });
    if (!response.ok) throw new Error('Failed to check verification');
    return response.json();
}

export async function updateUser(data: { user_id: number; phone: string; name: string; username?: string }) {
    const response = await fetch(`${API_URL}/user/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
}

export async function getCategories() {
    const response = await fetch(`${API_URL}/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
}

export async function createCategory(name: string, userId: number) {
    const response = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, user_id: userId }),
    });
    if (!response.ok) throw new Error('Failed to create category');
    return response.json();
}

export async function getUserStats(userId: number) {
    const response = await fetch(`${API_URL}/user/stats?user_id=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
}

export async function getMyPosts(userId: number) {
    const response = await fetch(`${API_URL}/market/my?user_id=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch my posts');
    return response.json();
}

export async function updatePost(postId: string, data: any) {
    const response = await fetch(`${API_URL}/market/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update post');
    return response.json();
}

export async function deletePost(postId: string, userId: number) {
    const response = await fetch(`${API_URL}/market/${postId}?user_id=${userId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete post');
    return response.json();
}

export async function getMyBids(userId: number) {
    const response = await fetch(`${API_URL}/bids/my?user_id=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch my bids');
    return response.json();
}

export async function getMyOrders(userId: number) {
    const response = await fetch(`${API_URL}/orders/my?user_id=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch my orders');
    return response.json();
}

export async function getOrderBids(orderId: number) {
    const response = await fetch(`${API_URL}/bids?order_id=${orderId}`);
    if (!response.ok) throw new Error('Failed to fetch order bids');
    return response.json();
}

export async function placeBid(bidData: any) {
    const response = await fetch(`${API_URL}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bidData),
    });
    if (!response.ok) throw new Error('Failed to place bid');
    return response.json();
}

export async function acceptBid(bidId: number) {
    const response = await fetch(`${API_URL}/bids/${bidId}/accept`, {
        method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to accept bid');
    return response.json();
}

export async function getConfig() {
    const response = await fetch(`${API_URL}/config`);
    if (!response.ok) throw new Error('Failed to fetch config');
    return response.json();
}

export async function sendChatHandoff(targetUserId: number, senderId: number, payload: any) {
    const response = await fetch(`${API_URL}/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_user_id: targetUserId, sender_id: senderId, payload })
    });
    if (!response.ok) throw new Error('Failed to send chat handoff');
    return response.json();
}
