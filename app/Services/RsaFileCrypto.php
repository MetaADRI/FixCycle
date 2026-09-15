<?php

namespace App\Services;

class RsaFileCrypto
{
    protected string $privateKey;
    protected string $publicKey;

    public function __construct(string $privateKey, string $publicKey)
    {
        $this->privateKey = $privateKey;
        $this->publicKey = $publicKey;
    }

    // Encrypt file content with Public key
    public function encryptWithPublicKey($data)
    {
        $encrypted = "";
        $publicKey = openssl_pkey_get_public($this->publicKey); // Load the key

        if (!$publicKey) {
            throw new \Exception("Invalid private key");
        }

        // Compute safe chunk size: keyBytes − 11 ( v1.5 padding overhead)
        $details       = openssl_pkey_get_details($publicKey);
        $keyBytes      = $details['bits'] / 8;      // 256 for 2048‑bit, 384 for 3072‑bit, …
        $maxPlainBytes = $keyBytes - 11;
        $plainData = str_split($data, $maxPlainBytes);
        foreach($plainData as $chunk)
        {
            $partialEncrypted = '';
            $encryptionOk = openssl_public_encrypt($chunk, $partialEncrypted, $publicKey);
            if($encryptionOk === false){return false;}
            $encrypted .= $partialEncrypted;
        }

        return $encrypted;
    }

    // Decrypt file with Private key
    public function decryptWithPrivateKey(string $encrypted): string
    {
        $privateKey = openssl_pkey_get_private($this->privateKey);
        if (!$privateKey) {
            throw new \Exception('Invalid public key');
        }

        // --- figure out RSA key length ----
        $details  = openssl_pkey_get_details($privateKey);
        $keySize  = $details['bits'] / 8;          // 256 for 2048‑bit, 384 for 3072‑bit …
        $chunks   = str_split($encrypted, $keySize);

        $decrypted = '';
        foreach ($chunks as $chunk) {
            $partial = '';
            if (!openssl_private_decrypt($chunk, $partial, $privateKey, OPENSSL_PKCS1_PADDING)) {
                throw new \Exception('Decryption failed: '.openssl_error_string());
            }
            $decrypted .= $partial;
        }

        return $decrypted;
    }

}
