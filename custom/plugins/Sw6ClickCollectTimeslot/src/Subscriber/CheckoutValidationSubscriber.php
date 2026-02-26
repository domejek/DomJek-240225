<?php declare(strict_types=1);

namespace Sw6ClickCollectTimeslot\Subscriber;

use Shopware\Core\Checkout\Cart\Event\CheckoutOrderPlacedEvent;
use Shopware\Core\Framework\Routing\RoutingException;
use Sw6ClickCollectTimeslot\Service\TimeslotService;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\RequestStack;

class CheckoutValidationSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly TimeslotService $timeslotService,
        private readonly RequestStack $requestStack
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            CheckoutOrderPlacedEvent::class => 'onCheckoutOrderPlaced',
        ];
    }

    public function onCheckoutOrderPlaced(CheckoutOrderPlacedEvent $event): void
    {
        $request = $this->requestStack->getMainRequest();
        
        if (!$request) {
            return;
        }

        $isClickCollect = $request->request->getBoolean('sw_click_collect_is_pickup', false);
        
        if (!$isClickCollect) {
            return;
        }

        $timeslotValue = $request->request->get('sw_timeslot');

        if (!$timeslotValue) {
            $timeslotValue = $request->cookies->get('sw_click_collect_timeslot');
        }

        if (empty($timeslotValue)) {
            throw RoutingException::invalidRequestParameter(
                'sw_timeslot',
                'Bitte wählen Sie ein Abholzeitfenster aus.'
            );
        }
    }
}
