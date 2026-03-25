import { ComponentProps, ReactNode, useMemo } from 'react';
import { standalone_routes } from '@/components/shared';
import { useFirebaseCountriesConfig } from '@/hooks/firebase/useFirebaseCountriesConfig';
import useRemoteConfig from '@/hooks/growthbook/useRemoteConfig';
import useThemeSwitcher from '@/hooks/useThemeSwitcher';
import useTMB from '@/hooks/useTMB';
import RootStore from '@/stores/root-store';
import { clearAuthData } from '@/utils/auth-utils';
import {
    LegacyCashierIcon,
    LegacyChartsIcon,
    LegacyLogout1pxIcon,
    LegacyTheme1pxIcon,
    LegacyWhatsappIcon,
} from '@deriv/quill-icons/Legacy';
import { BrandDerivLogoCoralIcon } from '@deriv/quill-icons/Logo';
import { useTranslations } from '@deriv-com/translations';
import { ToggleSwitch } from '@deriv-com/ui';
import { URLConstants } from '@deriv-com/utils';

export type TSubmenuSection = 'accountSettings' | 'cashier' | 'reports';

//IconTypes
type TMenuConfig = {
    LeftComponent: React.ElementType;
    RightComponent?: ReactNode;
    as: 'a' | 'button';
    href?: string;
    label: ReactNode;
    onClick?: () => void;
    removeBorderBottom?: boolean;
    submenu?: TSubmenuSection;
    target?: ComponentProps<'a'>['target'];
    isActive?: boolean;
}[];

const useMobileMenuConfig = (client?: RootStore['client']) => {
    const { localize } = useTranslations();
    const { is_dark_mode_on, toggleTheme } = useThemeSwitcher();

    const { data } = useRemoteConfig(true);
    const { cs_chat_whatsapp } = data;

    // Get current account information for dependency tracking
    const is_virtual = client?.is_virtual;
    const currency = client?.getCurrency?.();
    const is_logged_in = client?.is_logged_in;
    const client_residence = client?.residence;
    const accounts = client?.accounts || {};
    const { isTmbEnabled } = useTMB();
    const is_tmb_enabled = window.is_tmb_enabled || isTmbEnabled();

    const { hubEnabledCountryList } = useFirebaseCountriesConfig();

    const has_wallet = Object.keys(accounts).some(id => accounts[id].account_category === 'wallet');
    const is_hub_enabled_country = hubEnabledCountryList.includes(client?.residence || '');

    const menuConfig = useMemo(
        (): TMenuConfig[] => [
            [
                {
                    as: 'a',
                    href: standalone_routes.deriv_com,
                    label: localize('Deriv.com'),
                    LeftComponent: BrandDerivLogoCoralIcon,
                },
                {
                    as: 'a',
                    href: standalone_routes.bot,
                    label: localize('Trade'),
                    LeftComponent: LegacyChartsIcon,
                    isActive: true,
                },
                !has_wallet &&
                    !is_hub_enabled_country && {
                        as: 'a',
                        href: standalone_routes.cashier_deposit,
                        label: localize('Cashier'),
                        LeftComponent: LegacyCashierIcon,
                    },
                {
                    as: 'button',
                    label: localize('Dark theme'),
                    LeftComponent: LegacyTheme1pxIcon,
                    RightComponent: <ToggleSwitch value={is_dark_mode_on} onChange={toggleTheme} />,
                },
            ].filter(Boolean) as TMenuConfig,
            [
                cs_chat_whatsapp
                    ? {
                          as: 'a',
                          href: URLConstants.whatsApp,
                          label: localize('WhatsApp'),
                          LeftComponent: LegacyWhatsappIcon,
                          target: '_blank',
                      }
                    : null,
            ].filter(Boolean) as TMenuConfig,
            is_logged_in
                ? [
                      {
                          as: 'button',
                          label: localize('Logout'),
                          LeftComponent: LegacyLogout1pxIcon,
                          removeBorderBottom: true,
                          onClick: () => {
                              clearAuthData();
                          },
                      },
                  ]
                : [],
        ],
        [is_virtual, currency, is_logged_in, client_residence, is_tmb_enabled]
    );

    return {
        config: menuConfig,
    };
};

export default useMobileMenuConfig;
