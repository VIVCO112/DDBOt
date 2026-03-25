import { useState } from 'react';
import Dialog from '@/components/shared_ui/dialog';
import Button from '@/components/shared_ui/button';
import Text from '@/components/shared_ui/text';
import { Localize } from '@deriv-com/translations';
import './api-token-modal.scss';

type TApiTokenModalProps = {
    is_open: boolean;
    onClose: () => void;
};

const ApiTokenModal = ({ is_open, onClose }: TApiTokenModalProps) => {
    const [api_token, setApiToken] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!api_token.trim()) {
            setError('Please enter your API token');
            return;
        }

        try {
            setLoading(true);
            setError('');

            // Validate API token by making a test API call
            const response = await fetch('https://api.deriv.com/api/v3', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    authorize: api_token,
                }),
            });

            if (!response.ok) {
                throw new Error('Invalid API token. Please check and try again.');
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message || 'Failed to authorize with API token');
            }

            // Store the API token and authorization details in localStorage
            localStorage.setItem('api_token', api_token);
            localStorage.setItem('auth_data', JSON.stringify(data.authorize));

            // Show success message and reload after a short delay
            setTimeout(() => {
                window.location.href = '/';
            }, 500);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to login with API token. Please try again.';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setApiToken('');
        setError('');
        onClose();
    };

    return (
        <Dialog
            title={<Localize i18n_default_text='Login with API Token' />}
            is_visible={is_open}
            onCancel={handleClose}
            has_close_icon
            className='api-token-modal'
        >
            <div className='api-token-modal__content'>
                <Text as='p' size='xs' className='api-token-modal__description'>
                    <Localize i18n_default_text='Enter your Deriv API token to login and access your trading account. Your API token will be validated securely.' />
                </Text>

                <input
                    type='password'
                    className='api-token-modal__input'
                    placeholder='API Token'
                    value={api_token}
                    onChange={e => {
                        setApiToken(e.target.value);
                        setError('');
                    }}
                    disabled={loading}
                />

                {error && (
                    <Text as='p' size='xs' className='api-token-modal__error'>
                        {error}
                    </Text>
                )}

                <a
                    href='https://app.deriv.com/account/security/api-token'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='api-token-modal__link'
                >
                    <Localize i18n_default_text='Get your API token from Deriv API Token Settings' />
                </a>

                <div className='api-token-modal__buttons'>
                    <Button
                        tertiary
                        onClick={handleClose}
                        disabled={loading}
                    >
                        <Localize i18n_default_text='Cancel' />
                    </Button>
                    <Button
                        primary
                        onClick={handleLogin}
                        disabled={loading}
                    >
                        {loading ? <Localize i18n_default_text='Logging in...' /> : <Localize i18n_default_text='Login' />}
                    </Button>
                </div>
            </div>
        </Dialog>
    );
};

export default ApiTokenModal;
