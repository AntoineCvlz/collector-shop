<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Prometheus\CollectorRegistry;
use Prometheus\Storage\Adapter;
use Prometheus\Storage\APC;
use Prometheus\Storage\InMemory;

/**
 * Enregistre le registre Prometheus partagé de l'application.
 *
 * Stockage :
 *   - APCu en production (persiste les compteurs entre les requêtes d'un même
 *     worker PHP-FPM, sans dépendance externe). Nécessite ext-apcu + apc.enable_cli.
 *   - InMemory en secours (CLI/tests sans APCu) : le registre reste fonctionnel,
 *     seules les valeurs ne survivent pas à la requête.
 *
 * Le registre est un singleton : le middleware et le contrôleur /metrics
 * partagent la même instance (donc les mêmes séries de métriques).
 */
class MetricsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(CollectorRegistry::class, function (): CollectorRegistry {
            return new CollectorRegistry($this->makeStorage(), false);
        });
    }

    /**
     * APCu quand il est RÉELLEMENT actif (apcu_enabled() est la seule source de
     * vérité : apc.enabled peut valoir 1 sans APCu opérationnel, ex. en CLI avec
     * apc.enable_cli=0). Sinon InMemory — le registre reste fonctionnel, seules
     * les valeurs ne survivent pas à la requête (suffisant en test/CLI).
     */
    private function makeStorage(): Adapter
    {
        if (\extension_loaded('apcu') && \function_exists('apcu_enabled') && \apcu_enabled()) {
            return new APC;
        }

        return new InMemory;
    }
}
