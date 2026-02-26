<?php declare(strict_types=1);

namespace Sw6ClickCollectTimeslot\Service;

use Shopware\Core\Defaults;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\System\CustomField\CustomFieldTypes;

class CustomFieldsInstaller
{
    private const CUSTOM_FIELDSET_NAME = 'sw6_clickcollect_timeslot_set';

    private const CUSTOM_FIELDSET = [
        'name' => self::CUSTOM_FIELDSET_NAME,
        'config' => [
            'label' => [
                'en-GB' => 'Click & Collect Timeslot',
                'de-DE' => 'Click & Collect Zeitfenster',
                Defaults::LANGUAGE_SYSTEM => 'Click & Collect Timeslot'
            ]
        ],
        'customFields' => [
            [
                'name' => 'sw6_clickcollect_timeslot',
                'type' => CustomFieldTypes::TEXT,
                'config' => [
                    'label' => [
                        'en-GB' => 'Timeslot',
                        'de-DE' => 'Zeitfenster',
                        Defaults::LANGUAGE_SYSTEM => 'Timeslot'
                    ],
                    'customFieldPosition' => 1
                ]
            ],
            [
                'name' => 'sw6_clickcollect_is_pickup',
                'type' => CustomFieldTypes::BOOL,
                'config' => [
                    'label' => [
                        'en-GB' => 'Is Store Pickup',
                        'de-DE' => 'Ist Abholung im Store',
                        Defaults::LANGUAGE_SYSTEM => 'Is Store Pickup'
                    ],
                    'customFieldPosition' => 2
                ]
            ],
            [
                'name' => 'sw6_clickcollect_shipping_method_name',
                'type' => CustomFieldTypes::TEXT,
                'config' => [
                    'label' => [
                        'en-GB' => 'Shipping Method Name',
                        'de-DE' => 'Versandartenname',
                        Defaults::LANGUAGE_SYSTEM => 'Shipping Method Name'
                    ],
                    'customFieldPosition' => 3
                ]
            ]
        ]
    ];

    public function __construct(
        private readonly EntityRepository $customFieldSetRepository,
        private readonly EntityRepository $customFieldSetRelationRepository
    ) {
    }

    public function install(Context $context): void
    {
        $this->customFieldSetRepository->upsert([
            self::CUSTOM_FIELDSET
        ], $context);
    }

    public function addRelations(Context $context): void
    {
        $this->customFieldSetRelationRepository->upsert(array_map(function (string $customFieldSetId) {
            return [
                'customFieldSetId' => $customFieldSetId,
                'entityName' => 'order',
            ];
        }, $this->getCustomFieldSetIds($context)), $context);
    }

    /**
     * @return list<string>
     */
    private function getCustomFieldSetIds(Context $context): array
    {
        $criteria = new Criteria();

        $criteria->addFilter(new EqualsFilter('name', self::CUSTOM_FIELDSET_NAME));

        return $this->customFieldSetRepository->searchIds($criteria, $context)->getIds();
    }
}
