<?php declare(strict_types=1);

namespace Sw6ClickCollectTimeslot\Subscriber;

use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Storefront\Page\PageLoadedEvent;
use Sw6ClickCollectTimeslot\Service\TimeslotService;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class CheckoutConfirmPageSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly TimeslotService $timeslotService,
        private readonly EntityRepository $salesChannelRepository
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            'Shopware_SalesChannel_Page_Loaded' => 'onPageLoaded',
        ];
    }

    public function onPageLoaded(PageLoadedEvent $event): void
    {
        $salesChannelContext = $event->getSalesChannelContext();
        $salesChannelId = $salesChannelContext->getSalesChannelId();

        $timeslots = $this->timeslotService->getTimeslots($salesChannelId);
        $shippingMethodName = $this->timeslotService->getShippingMethodName($salesChannelId);

        $event->getPage()->assign([
            'clickCollectTimeslots' => $timeslots,
            'clickCollectShippingMethodName' => $shippingMethodName,
        ]);
    }
}
