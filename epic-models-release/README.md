# EPIC Models & Talent — Production Release

Production deployment created August 1, 2026.

- Vercel project: `epic-models-and-talent`
- Production URL: https://epic-models-and-talent.vercel.app
- Deployment ID: `dpl_2q74SQ4Ept2pS9CamHUvkNydX64J`
- Release branch: `epic-models-and-talent-production`
- Existing `main` branch and bikini-contest deployment remain untouched.

## Release artifact

The production build is stored as a checksum-verified Brotli-compressed tar artifact split into these ordered segments:

1. `chunk-00`
2. `chunk-01`
3. `chunk-02`
4. `chunk-03a` + `chunk-03b`
5. `chunk-04`
6. `chunk-05`

Ignore the superseded `chunk-03`; it was replaced by `chunk-03a` and `chunk-03b` after integrity verification.

SHA-256 checksums:

- Encoded artifact: `09c9f3e137635203b0b284f16b3d283bcde94813f1ff41dea1af781914ccee66`
- Compressed artifact: `896fe18db981d0d22143bc5a5ff658edf928ae5931316ef73e6ec415066da15e`
- Extracted tar: `d4fc059b07411d43e368d84d45e2993322cefee499b250fd893aa3134d771646`

## Required production environment variables

The public website is deployed. Secure talent and client form submission requires:

- `GAS_WEB_APP_URL`
- `GAS_SHARED_SECRET`
- `ALLOWED_ORIGINS`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_UPLOAD_FOLDER`
- Optional: `ANALYTICS_WEBHOOK_URL`

The custom domains `epicmodelsandtalent.com` and `www.epicmodelsandtalent.com` are not currently assigned to this Vercel project.