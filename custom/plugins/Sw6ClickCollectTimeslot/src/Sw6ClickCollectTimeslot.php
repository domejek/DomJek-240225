<?php declare(strict_types=1);

namespace Sw6ClickCollectTimeslot;

use Shopware\Core\Framework\Plugin;
use Shopware\Storefront\Theme\ThemeLifecycleHandler;
use Shopware\Storefront\Theme\ThemeLifecycleService;

class Sw6ClickCollectTimeslot extends Plugin
{
    public function install(Plugin\Context\InstallContext $installContext): void
    {
        $this->getCustomFieldsInstaller()->install($installContext->getContext());
    }

    public function uninstall(Plugin\Context\UninstallContext $uninstallContext): void
    {
        parent::uninstall($uninstallContext);

        if ($uninstallContext->keepUserData()) {
            return;
        }
    }

    public function activate(Plugin\Context\ActivateContext $activateContext): void
    {
        $this->getCustomFieldsInstaller()->addRelations($activateContext->getContext());
    }

    public function deactivate(Plugin\Context\DeactivateContext $deactivateContext): void
    {
    }

    public function update(Plugin\Context\UpdateContext $updateContext): void
    {
    }

    public function postInstall(Plugin\Context\InstallContext $installContext): void
    {
    }

    public function postUpdate(Plugin\Context\UpdateContext $updateContext): void
    {
    }

    private function getCustomFieldsInstaller(): Service\CustomFieldsInstaller
    {
        if ($this->container->has(Service\CustomFieldsInstaller::class)) {
            return $this->container->get(Service\CustomFieldsInstaller::class);
        }

        return new Service\CustomFieldsInstaller(
            $this->container->get('custom_field_set.repository'),
            $this->container->get('custom_field_set_relation.repository')
        );
    }
}
