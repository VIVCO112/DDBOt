import React from 'react';
import { observer } from 'mobx-react-lite';
import Text from '@/components/shared_ui/text';
import { DBOT_TABS } from '@/constants/bot-contents';
import { useStore } from '@/hooks/useStore';
import { Localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import { save_types } from '@/external/bot-skeleton';
import { FREE_BOT_FILENAMES } from '@/utils/bot-list';

type TFreeBots = {
    name: string;
    filename: string;
};

const FreeBots = observer(() => {
    const { load_modal, dashboard } = useStore();
    const { setActiveTab } = dashboard;
    const { loadStrategyToBuilder } = load_modal;
    const { isDesktop } = useDevice();
    const [free_bots] = React.useState<TFreeBots[]>(() => {
        return FREE_BOT_FILENAMES.map(filename => ({
            filename,
            name: filename.replace('.xml', '').replace(/_/g, ' '),
        }));
    });

    const handleBotClick = async (filename: string) => {
        try {
            const response = await fetch(`/bots/${filename}`);
            const xmlContent = await response.text();
            
            await loadStrategyToBuilder({
                id: filename,
                name: filename.replace('.xml', ''),
                xml: xmlContent,
                save_type: save_types.LOCAL,
            }, true);
            
            setActiveTab(DBOT_TABS.BOT_BUILDER);
        } catch (error) {
            console.error('Failed to load bot:', error);
        }
    };

    if (!free_bots.length) {
        return null;
    }

    return (
        <div className='free-bots__container'>
            <div className='free-bots__title'>
                <Text size={isDesktop ? 's' : 'xs'} weight='bold'>
                    <Localize i18n_default_text='Free Bots:' />
                </Text>
            </div>
            <div className='free-bots__grid'>
                {free_bots.map(bot => (
                    <div
                        key={bot.filename}
                        className='free-bots__item'
                        onClick={() => handleBotClick(bot.filename)}
                    >
                        <div className='free-bots__item__content'>
                            <Text
                                align='center'
                                as='p'
                                size={isDesktop ? 'xs' : 'xxs'}
                                lineHeight='l'
                                className='free-bots__item__name'
                            >
                                {bot.name}
                            </Text>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

export default FreeBots;
