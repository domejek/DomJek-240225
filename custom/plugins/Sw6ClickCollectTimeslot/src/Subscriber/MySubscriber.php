<?php declare(strict_types=1);

namespace Sw6ClickCollectTimeslot\Subscriber;

use Shopware\Core\Checkout\Cart\Event\CheckoutOrderPlacedEvent;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Sw6ClickCollectTimeslot\Service\TimeslotService;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\RequestStack;

class MySubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly RequestStack $requestStack,
        private readonly EntityRepository $orderRepository,
        private readonly TimeslotService $timeslotService
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            CheckoutOrderPlacedEvent::class => 'onOrderPlaced',
        ];
    }

    public function onOrderPlaced(CheckoutOrderPlacedEvent $event): void
    {
        $request = $this->requestStack->getMainRequest();
        
        if (!$request) {
            return;
        }

        $isClickCollect = $request->request->getBoolean('sw_click_collect_is_pickup', false);
        
        if (!$isClickCollect) {
            $isClickCollect = $request->cookies->has('sw_click_collect_is_pickup');
        }
        
        if (!$isClickCollect) {
            return;
        }

        $timeslotValue = $request->request->get('sw_timeslot');

        if (!$timeslotValue) {
            $timeslotValue = $request->cookies->get('sw_click_collect_timeslot');
        }

        if (!$timeslotValue) {
            return;
        }

        $salesChannelId = $event->getSalesChannelContext()->getSalesChannelId();
        $shippingMethodName = $this->timeslotService->getShippingMethodName($salesChannelId);
        
        $order = $event->getOrder();
        
        $this->orderRepository->update([
            [
                'id' => $order->getId(),
                'customFields' => [
                    'sw6_clickcollect_timeslot' => $timeslotValue,
                    'sw6_clickcollect_is_pickup' => true,
                    'sw6_clickcollect_shipping_method_name' => $shippingMethodName,
                ],
            ],
        ], $event->getContext());
    }
}
