<?php declare(strict_types=1);

namespace Sw6ClickCollectTimeslot\Subscriber;

use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\FrameworkException;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Page\Checkout\Confirm\CheckoutConfirmPageLoadedEvent;
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
            CheckoutConfirmPageLoadedEvent::class => 'onCheckoutConfirmPageLoaded',
        ];
    }

    public function onCheckoutConfirmPageLoaded(CheckoutConfirmPageLoadedEvent $event): void
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
