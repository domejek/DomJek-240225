<?php declare(strict_types=1);

namespace Sw6ClickCollectTimeslot\Subscriber;

use Shopware\Core\Checkout\Cart\Event\CheckoutOrderPlacedEvent;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\RequestStack;

class MySubscriber implements EventSubscriberInterface
{
    private const TIMESLOT_LABELS = [
        'timeslot1' => '09:00 - 11:00 Uhr',
        'timeslot2' => '11:00 - 13:00 Uhr',
        'timeslot3' => '13:00 - 15:00 Uhr',
    ];

    public function __construct(
        private readonly RequestStack $requestStack,
        private readonly EntityRepository $orderRepository
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

        $isClickCollect = $request->request->get('sw_click_collect_is_pickup', false);
        $timeslotValue = $request->request->get('sw_timeslot') ?? $request->cookies->get('sw_click_collect_timeslot');

        if (!$isClickCollect && !$timeslotValue) {
            $timeslotValue = $request->cookies->get('sw_click_collect_timeslot');
        }

        if (!$timeslotValue) {
            return;
        }

        $timeslotLabels = [];
        $timeslotValues = explode(',', $timeslotValue);
        foreach ($timeslotValues as $value) {
            $timeslotLabels[] = self::TIMESLOT_LABELS[trim($value)] ?? trim($value);
        }
        $timeslotLabel = implode(', ', $timeslotLabels);

        $order = $event->getOrder();
        
        $this->orderRepository->update([
            [
                'id' => $order->getId(),
                'customFields' => [
                    'sw6_clickcollect_timeslot' => $timeslotLabel,
                    'sw6_clickcollect_is_pickup' => true,
                ],
            ],
        ], $event->getContext());
    }
}