<?php
declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;

/**
 * Generate an RSA key‑pair and persist it under storage/merchant_keys/.
 *
 * Usage:
 *   $gen = new \App\Services\RsaKeyPairGenerator('contrato');
 *   $keys = $gen->generate();          // default 2048‑bit, no passphrase
 *
 *   // $keys = [
 *   //   'private_pem'  => '-----BEGIN PRIVATE KEY …',
 *   //   'public_pem'   => '-----BEGIN PUBLIC KEY …',
 *   //   'private_path' => '/absolute/…/storage/merchant_keys/contrato_private.pem',
 *   //   'public_path'  => '/absolute/…/storage/merchant_keys/contrato_public.pem',
 *   // ];
 */
class RsaKeyPairGenerator
{
    /** File‑name prefix (e.g. “merchant id” or “client code”) */
    protected string $alias;

    /** Laravel filesystem disk (default “local” = storage/app) */
    protected string $disk;

    public function __construct(string $alias, string $disk = 'local')
    {
        $this->alias = $alias;
        $this->disk  = $disk;
    }

    /**
     * @param  int         $bits       RSA key size (2048 / 3072 / 4096)
     * @param  string|null $passphrase Encrypt the private key with this passphrase (optional)
     * @return array {
     *     @var string private_pem   Raw private‑key PEM
     *     @var string public_pem    Raw public‑key PEM
     *     @var string private_path  Absolute file path on disk
     *     @var string public_path   Absolute file path on disk
     * }
     * @throws \RuntimeException     When OpenSSL fails
     */
    public function generate(int $bits = 2048, ?string $passphrase = null): array
    {
        /* 1 — Create the key resource */
        $res = openssl_pkey_new([
            'private_key_bits' => $bits,
            'private_key_type' => OPENSSL_KEYTYPE_RSA,
        ]);

        if ($res === false) {
            throw new \RuntimeException(
                'OpenSSL: unable to create key‑pair: ' . openssl_error_string()
            );
        }

        /* 2 — Export the private key */
        if (! openssl_pkey_export($res, $privatePem, $passphrase)) {
            throw new \RuntimeException(
                'OpenSSL: unable to export private key: ' . openssl_error_string()
            );
        }

        /* 3 — Extract the public key */
        $details = openssl_pkey_get_details($res);
        if (! $details || empty($details['key'])) {
            throw new \RuntimeException('OpenSSL: unable to obtain public key');
        }
        $publicPem = $details['key'];

        $relDir      = storage_path('merchant_keys');
        $privateRel  = "$relDir/{$this->alias}_private.pem";
        $publicRel   = "$relDir/{$this->alias}_public.pem";

        $disk = Storage::disk('merchant_keys');
        $disk->put("{$this->alias}_private.pem", $privatePem);
        $disk->put("{$this->alias}_public.pem",  $publicPem);


        return [
            'private_pem'  => $privatePem,
            'public_pem'   => $publicPem,
            'private_path' => $disk->path($privateRel),
            'public_path'  => $disk->path($publicRel),
        ];
    }
}
