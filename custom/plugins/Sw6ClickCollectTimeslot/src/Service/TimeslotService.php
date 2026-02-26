<?php declare(strict_types=1);

namespace Sw6ClickCollectTimeslot\Service;

use Shopware\Core\System\SystemConfig\SystemConfigService;

class TimeslotService
{
    private const PLUGIN_CONFIG_PREFIX = 'Sw6ClickCollectTimeslot.config.';

    public function __construct(
        private readonly SystemConfigService $systemConfigService
    ) {
    }

    public function getTimeslots(?string $salesChannelId = null): array
    {
        $timeslotsString = $this->systemConfigService->get(
            self::PLUGIN_CONFIG_PREFIX . 'timeslots',
            $salesChannelId
        );

        if ($timeslotsString === null || $timeslotsString === '') {
            return $this->getDefaultTimeslots();
        }

        return $this->parseTimeslots($timeslotsString);
    }

    public function getTimeslotLabels(?string $salesChannelId = null): array
    {
        $timeslots = $this->getTimeslots($salesChannelId);
        
        $labels = [];
        foreach ($timeslots as $index => $timeslot) {
            $labels['timeslot' . ($index + 1)] = $timeslot;
        }

        return $labels;
    }

    public function getShippingMethodName(?string $salesChannelId = null): string
    {
        $value = $this->systemConfigService->get(
            self::PLUGIN_CONFIG_PREFIX . 'shippingMethodName',
            $salesChannelId
        );

        return is_string($value) && $value !== '' ? $value : 'Abholung im Store';
    }

    private function parseTimeslots(string $timeslotsString): array
    {
        $timeslots = array_map('trim', explode(',', $timeslotsString));
        
        return array_filter($timeslots, function ($timeslot) {
            return !empty($timeslot);
        });
    }

    private function getDefaultTimeslots(): array
    {
        return [
            '09:00-11:00',
            '11:00-13:00',
            '13:00-15:00',
        ];
    }
}
