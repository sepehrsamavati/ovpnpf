// parseMigration.mjs
import { Buffer } from 'buffer';
import base32 from 'base32.js';
import protobuf from 'protobufjs';

/**
 * Convert Google Authenticator migration URI to a standard OTP URI
 *
 * @param {string} migrationUri
 * @returns {Promise<string[]>} - Array of `otpauth://` strings
 */
export async function parseMigrationUri(migrationUri) {
    if (!migrationUri.startsWith('otpauth-migration://offline?data=')) {
        throw new Error('Invalid migration URI');
    }

    const base64Data = migrationUri.replace('otpauth-migration://offline?data=', '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Inline protobuf definition to avoid external file
    const root = new protobuf.Root();
    const OTPParameters = new protobuf.Type("OTPParameters")
        .add(new protobuf.Field("secret", 1, "bytes"))
        .add(new protobuf.Field("name", 2, "string"))
        .add(new protobuf.Field("issuer", 3, "string"))
        .add(new protobuf.Field("algorithm", 4, "int32"))
        .add(new protobuf.Field("digits", 5, "int32"))
        .add(new protobuf.Field("type", 6, "int32"));

    const MigrationPayload = new protobuf.Type("MigrationPayload")
        .add(new protobuf.Field("otp_parameters", 1, "OTPParameters", "repeated"))
        .add(new protobuf.Field("version", 2, "int32"));

    root.define("auth").add(OTPParameters).add(MigrationPayload);

    const MigrationType = root.lookupType("auth.MigrationPayload");
    const decoded = MigrationType.decode(buffer);

    const encoder = new base32.Encoder({ type: 'rfc4648', lc: true });

    return decoded.otp_parameters.map((param) => {
        const secret = encoder.write(param.secret).finalize();
        const label = param.name;
        const issuer = param.issuer || '';
        return `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}${issuer ? `&issuer=${encodeURIComponent(issuer)}` : ''
            }`;
    });
}