import json

from app.services.promotion_strategy_profiles import load_promotion_strategy_profiles


def test_load_promotion_strategy_profiles_from_runtime_file(tmp_path) -> None:
    runtime_file = tmp_path / "promotion_strategy_profiles.json"
    runtime_file.write_text(
        json.dumps(
            [
                {
                    "market_id": 1,
                    "shop_id": "market:1",
                    "ad_group_id": "group-1",
                    "asin": "B000TEST02",
                    "strategy_role": "main_push",
                    "strategy_label": "主推款",
                    "start_date": "2026-06-01",
                    "end_date": "2026-06-30",
                    "source_type": "人工语义",
                }
            ],
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    profiles = load_promotion_strategy_profiles(runtime_file)

    assert profiles == [
        {
            "market_id": 1,
            "shop_id": "market:1",
            "ad_group_id": "group-1",
            "asin": "B000TEST02",
            "strategy_role": "main_push",
            "strategy_label": "主推款",
            "start_date": "2026-06-01",
            "end_date": "2026-06-30",
            "source_type": "人工语义",
        }
    ]
