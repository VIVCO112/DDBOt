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

            // Store the API token in localStorage first
            localStorage.setItem('authToken', api_token);
            sessionStorage.setItem('query_param_currency', 'USD');

            // Try to validate token using WebSocket API if available
            if ((window as any).DerivAPIBasic) {
                const api = new (window as any).DerivAPIBasic({
                    connection: new WebSocket('wss://ws.binaryws.com/websockets/v3'),
                });

                const authResponse = await new Promise((resolve, reject) => {
                    api.authorize(api_token).then(resolve).catch(reject);
                });

                if ((authResponse as any)?.error) {
                    localStorage.removeItem('authToken');
                    throw new Error(
                        (authResponse as any).error?.message || 'Invalid API token. Please check and try again.'
                    );
                }

                // Store successful auth data in the format the app expects
                if ((authResponse as any)?.authorize) {
                    const authData = (authResponse as any).authorize;
                    
                    // Store active login ID
                    localStorage.setItem('active_loginid', authData.loginid);
                    
                    // Store account list as an object mapping loginid to account data
                    // This format is expected by V2GetActiveClientId in appId.js
                    const accountsList = {
                        [authData.loginid]: {
                            token: api_token,
                            ...authData,
                        },
                    };
                    localStorage.setItem('accountsList', JSON.stringify(accountsList));
                    
                    // Store balance data for immediate display
                    // The balance should be a number from the authorize response
                    const balance = typeof authData.balance === 'string' ? parseFloat(authData.balance) : authData.balance || 0;
                    if (balance !== null && balance !== undefined) {
                        const balanceData = {
                            accounts: {
                                [authData.loginid]: {
                                    balance: balance,
                                    currency: authData.currency || 'USD',
                                    loginid: authData.loginid,
                                },
                            },
                        };
                        localStorage.setItem('all_accounts_balance', JSON.stringify(balanceData));
                        console.log('Stored balance data:', balanceData);
                    } else {
                        console.warn('No balance data in authorize response');
                    }
                    
                    localStorage.setItem('clientAccounts', JSON.stringify([authData]));
                }
            } else {
                // Fallback: just store the token and reload
                console.warn('WebSocket API not available, storing token for next session');
            }

            // Set a short delay before reload to ensure storage is written
            setTimeout(() => {
                window.location.href = '/';
            }, 300);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to authenticate with API token. Please check and try again.';
            setError(errorMsg);
            // Clear stored data on error
            localStorage.removeItem('authToken');
            localStorage.removeItem('active_loginid');
            localStorage.removeItem('accountsList');
            localStorage.removeItem('clientAccounts');
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
