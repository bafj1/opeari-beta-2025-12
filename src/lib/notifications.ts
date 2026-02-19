import { supabase } from './supabase';

interface CreateNotificationParams {
    userId: string;
    type: 'mention' | 'like' | 'comment' | 'reply' | 'connection_request' | 'connection_accepted' | 'care_need' | 'match' | 'message' | 'village_update';
    title: string;
    body?: string;
    postId?: string;
    commentId?: string;
    fromUserId?: string;
    careNeedId?: string;
    link?: string;
}

export async function createNotification(params: CreateNotificationParams) {
    const { userId, type, title, body, postId, commentId, fromUserId, careNeedId, link } = params;

    // Don't notify yourself
    if (fromUserId && userId === fromUserId) {
        return;
    }

    try {
        // 1. Create in-app notification
        await supabase.from('notifications').insert({
            user_id: userId,
            type,
            title,
            body: body || null,
            post_id: postId || null,
            comment_id: commentId || null,
            from_user_id: fromUserId || null,
            care_need_id: careNeedId || null,
            link: link || null,
        });

        // 2. Send email notification for key event types
        const emailTypes = ['connection_request', 'connection_accepted', 'message'];
        if (emailTypes.includes(type)) {
            // Get sender name for the email
            let senderName = '';
            let senderFirstName = '';
            if (fromUserId) {
                const { data: sender } = await supabase
                    .from('members')
                    .select('first_name, role')
                    .eq('id', fromUserId)
                    .single();

                if (sender) {
                    senderFirstName = sender.first_name || '';
                    senderName = sender.role === 'caregiver'
                        ? `${sender.first_name}`
                        : `${sender.first_name}'s Family`;
                }
            }

            // Fire and forget — don't block the UI on email delivery
            fetch('/.netlify/functions/send-notification-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientId: userId,
                    type,
                    senderName,
                    senderFirstName,
                    messagePreview: type === 'message' ? body : undefined,
                }),
            }).catch(err => {
                console.error('Email notification failed (non-blocking):', err);
            });
        }
    } catch (err) {
        console.error('Error creating notification:', err);
    }
}
