# Pinned geospatial dependencies
Supercluster 8.0.1 and KDBush 4.0.2 are official upstream source, included with their ISC licenses. This avoids a runtime CDN dependency and permits reproducible offline builds.

- Supercluster: https://github.com/mapbox/supercluster/tree/v8.0.1
- Upstream index.js blob: c56439669b5fb7e54aaf37a1e19840f0f8bedeee
- KDBush: https://github.com/mourner/kdbush/tree/v4.0.2
- Upstream index.js blob: d9a82254c633a79af3834a8459f4a67f521a2fb7
- The only Supercluster implementation change is replacing its bare kdbush import with the relative ../kdbush/index.js path.
- Minimal package metadata and a TypeScript interface are provided locally. Algorithm implementation is upstream code, not a custom clustering substitute.
