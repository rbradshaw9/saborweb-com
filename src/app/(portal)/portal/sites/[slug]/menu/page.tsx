import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { loadGoodstartContent } from '@/generated-sites/goodstart/load-content';
import { PortalAuthorizationError, assertOwnsRestaurant, requirePortalUser } from '@/lib/portal/auth';
import { updateGoodstartMenu } from './actions';

function statusMessage(searchParams: { saved?: string | string[]; error?: string | string[] }) {
  const saved = Array.isArray(searchParams.saved) ? searchParams.saved[0] : searchParams.saved;
  const error = Array.isArray(searchParams.error) ? searchParams.error[0] : searchParams.error;

  if (saved === '1') return { tone: 'success', text: 'Menu saved.' };
  if (error === 'load-failed') return { tone: 'error', text: 'Could not load this restaurant. Try again.' };
  if (error === 'save-failed') return { tone: 'error', text: 'Could not save menu changes. Try again.' };
  return null;
}

export default async function PortalMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string | string[]; error?: string | string[] }>;
}) {
  const { slug } = await params;
  const user = await requirePortalUser(`/portal/sites/${slug}/menu`);

  let access;
  try {
    access = await assertOwnsRestaurant(user.id, slug);
  } catch (error) {
    if (error instanceof PortalAuthorizationError && error.code === 'not_found') notFound();
    throw error;
  }

  const content = await loadGoodstartContent(slug);
  const canEdit = access.membership.role === 'owner' || access.membership.role === 'manager';
  const message = statusMessage(await searchParams);
  const unsupported = slug !== 'goodstart';

  return (
    <section className="portal-wrap portal-grid">
      <Link className="portal-button portal-button--ghost w-fit" href={`/portal/sites/${slug}`}>
        <ArrowLeft size={16} />
        Restaurant dashboard
      </Link>

      <div className="portal-card portal-card--padded portal-grid">
        <div>
          <p className="eyebrow">Menu</p>
          <h1 className="text-4xl">{content.restaurant.name}</h1>
          <p className="portal-muted mt-3">Edit the existing categories and items shown on the public site.</p>
        </div>

        {message ? (
          <p className={message.tone === 'error' ? 'portal-error' : 'portal-success'}>{message.text}</p>
        ) : null}

        {unsupported ? (
          <p className="portal-error">Menu editing is enabled for Goodstart first. This site will be editable after migration.</p>
        ) : null}

        <form action={updateGoodstartMenu} className="portal-form">
          <input name="slug" type="hidden" value={slug} />

          <div className="portal-menu-list">
            {content.menuCategories.map((category, categoryIndex) => (
              <fieldset className="portal-menu-section" disabled={!canEdit || unsupported} key={`${category.name}-${categoryIndex}`}>
                <legend>{category.name}</legend>

                <div className="portal-form-grid">
                  <label>
                    Order
                    <input defaultValue={categoryIndex + 1} min={1} name={`category-${categoryIndex}-order`} type="number" />
                  </label>
                  <label>
                    Category name
                    <input defaultValue={category.name} name={`category-${categoryIndex}-name`} required type="text" />
                  </label>
                  <label>
                    Category description
                    <input defaultValue={category.description} name={`category-${categoryIndex}-description`} type="text" />
                  </label>
                  <label className="portal-checkbox">
                    <input name={`category-${categoryIndex}-delete`} type="checkbox" />
                    Delete
                  </label>
                </div>

                <div className="portal-menu-items">
                  {category.items.map((item, itemIndex) => {
                    const prefix = `item-${categoryIndex}-${itemIndex}`;
                    return (
                      <div className="portal-menu-item" key={`${item.name}-${itemIndex}`}>
                        <div className="portal-form-grid">
                          <label>
                            Order
                            <input defaultValue={itemIndex + 1} min={1} name={`${prefix}-order`} type="number" />
                          </label>
                          <label className="portal-checkbox">
                            <input defaultChecked={item.visible !== false} name={`${prefix}-visible`} type="checkbox" />
                            Visible
                          </label>
                          <label className="portal-checkbox">
                            <input name={`${prefix}-delete`} type="checkbox" />
                            Delete
                          </label>
                        </div>

                        <label>
                          Item name
                          <input defaultValue={item.name} name={`${prefix}-name`} required type="text" />
                        </label>

                        <label>
                          Description
                          <textarea defaultValue={item.description} name={`${prefix}-description`} rows={3} />
                        </label>

                        <div className="portal-form-grid">
                          <label>
                            Price text
                            <input defaultValue={item.priceText ?? ''} name={`${prefix}-priceText`} placeholder="$12" type="text" />
                          </label>
                          <label>
                            Badges
                            <input defaultValue={item.badges.join(', ')} name={`${prefix}-badges`} placeholder="Breakfast, Vegetarian" type="text" />
                          </label>
                        </div>
                      </div>
                    );
                  })}

                  <div className="portal-menu-item">
                    <p className="portal-pill w-fit">Add item</p>
                    <label>
                      Item name
                      <input name={`new-item-${categoryIndex}-name`} type="text" />
                    </label>
                    <label>
                      Description
                      <textarea name={`new-item-${categoryIndex}-description`} rows={3} />
                    </label>
                    <div className="portal-form-grid">
                      <label>
                        Price text
                        <input name={`new-item-${categoryIndex}-priceText`} placeholder="$12" type="text" />
                      </label>
                      <label>
                        Badges
                        <input name={`new-item-${categoryIndex}-badges`} placeholder="Breakfast, Vegetarian" type="text" />
                      </label>
                    </div>
                  </div>
                </div>
              </fieldset>
            ))}

            <fieldset className="portal-menu-section" disabled={!canEdit || unsupported}>
              <legend>Add category</legend>
              <div className="portal-form-grid">
                <label>
                  Order
                  <input defaultValue={content.menuCategories.length + 1} min={1} name="new-category-order" type="number" />
                </label>
                <label>
                  Category name
                  <input name="new-category-name" type="text" />
                </label>
                <label>
                  Category description
                  <input name="new-category-description" type="text" />
                </label>
              </div>
              <div className="portal-menu-item">
                <p className="portal-pill w-fit">First item</p>
                <label>
                  Item name
                  <input name="new-category-item-name" type="text" />
                </label>
                <label>
                  Description
                  <textarea name="new-category-item-description" rows={3} />
                </label>
                <div className="portal-form-grid">
                  <label>
                    Price text
                    <input name="new-category-item-priceText" placeholder="$12" type="text" />
                  </label>
                  <label>
                    Badges
                    <input name="new-category-item-badges" placeholder="Breakfast, Vegetarian" type="text" />
                  </label>
                </div>
              </div>
            </fieldset>
          </div>

          <div className="portal-actions">
            <button className="portal-button portal-button--primary" disabled={!canEdit || unsupported} type="submit">
              <Save size={16} />
              Save menu
            </button>
            {!canEdit ? <span className="portal-pill">Read only</span> : null}
          </div>
        </form>
      </div>
    </section>
  );
}
