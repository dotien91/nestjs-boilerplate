# Mobalytics Set Crawler

## Mục đích

Crawl các trang HTML public dưới:

```text
https://mobalytics.gg/tft/{setKey}
```

Crawler không gọi `/api/tft` vì path này bị Mobalytics disallow trong `robots.txt`.

## Endpoint

### Crawl và import toàn bộ một mùa

```http
POST /api/v1/crawler/crawl-set
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "season_id": "18",
  "locale": "en_us",
  "resources": ["units", "items"],
  "download_images": true
}
```

Endpoint thực hiện một workflow: crawl public pages, lưu snapshot theo
`(season_id, locale)`, sau đó upsert units, items, traits, augments và
compositions vào các collection chính. Có thể gọi lại an toàn; response trả
thống kê `crawled`, `imported` và `warnings` theo từng nhóm dữ liệu.

`resources` là optional và nhận: `units`, `items`, `traits`, `augments`,
`compositions`. Khi bỏ field này endpoint crawl tất cả. Khi chỉ định, endpoint
không request, không upsert và không ghi đè snapshot của các nhóm còn lại.

Khi `download_images=true`, crawler lưu ảnh theo format giống Mobalytics:

```text
src/asset/images/champions/icons/set18/ahri.png
src/asset/images/items/set18/bf-sword.png
```

FE sử dụng:

```text
GET /api/images/champions/icons/set18/ahri.png
GET /api/images/items/set18/bf-sword.png
```

```http
POST /api/v1/crawler/mobalytics-set
Authorization: Bearer <admin-access-token>
Content-Type: application/json
```

```json
{
  "setKey": "set18",
  "locale": "en_us",
  "persist": true
}
```

`setKey` phải có dạng `set<number>`. Hiện crawler chỉ nhận `en_us` vì route Mobalytics đang crawl là bản tiếng Anh.

## Dữ liệu được crawl

- Champion list và từng champion detail.
- Basic, combined, radiant, non-craftable, consumable và artifact items.
- Traits/synergies.
- Augments.
- Team compositions.

Crawler rate-limit champion detail bằng concurrency `2` và delay giữa request. Nếu một section lỗi, section khác vẫn được crawl. Snapshot chỉ được ghi khi có ít nhất một record hợp lệ.

## Database

Collection mới:

```text
tft-season-snapshots
```

Unique key:

```json
{
  "season_id": 1,
  "locale": 1
}
```

Document lưu:

- `season_id`
- `locale`
- `setKey`
- `source`
- `data`
- `crawledAt`
- `warnings`

Đây là collection mới nên không cần sửa hoặc xóa index của các collection hiện tại. Dữ liệu Mobalytics không được ghi thẳng vào `tft-units`, `tft-items`, `tft-traits` hoặc `tft-augments`, vì slug Mobalytics không bảo đảm tương đương Riot `apiName`.

## Data API

Các endpoint Data ưu tiên snapshot Mongo theo `(season_id, locale)`, sau đó mới fallback về file asset:

```http
GET /api/v1/data/tft/en_us?season_id=18
GET /api/v1/data/units/en_us?season_id=18
GET /api/v1/data/items/en_us?season_id=18
GET /api/v1/data/traits/en_us?season_id=18
GET /api/v1/data/augments/en_us?season_id=18
```

## Cloudflare

Mobalytics có thể trả trang Cloudflare `Just a moment...` hoặc HTTP `403` tùy IP/môi trường. Crawler:

- Không bypass challenge.
- Không gọi API bị robots chặn.
- Trả `502` và warning rõ URL bị chặn.
- Không ghi snapshot rỗng.

Nên chạy crawler từ một server/IP được phép truy cập các public pages, hoặc liên hệ Mobalytics để có nguồn/API được cấp phép. Không nên chạy cron dày; Set data chỉ cần refresh khi có thay đổi.

## Chạy thử

1. Dùng Node theo `.nvmrc`.
2. Khởi động backend và đăng nhập admin.
3. Gọi endpoint với `persist: false`.
4. Kiểm tra `counts` và `warnings`.
5. Khi output hợp lệ, chạy lại với `persist: true`.
