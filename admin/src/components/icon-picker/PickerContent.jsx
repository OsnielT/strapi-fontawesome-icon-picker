import {
  Flex,
  Box,
  Button,
  IconButton,
  Searchbar,
  Typography,
  Loader,
  Divider,
} from '@strapi/design-system';

import { useTranslate } from '../../hooks/useTranslate';
import FaSvg from './FaSvg';
import IconGrid from './IconGrid';
import PackageSelectors from './PackageSelectors';

const CategoryNav = ({ categories, onJump }) => (
  <>
    <Divider />
    <Flex gap={1} padding={2} overflow="auto" background="neutral100">
      {categories.map((cat) => (
        <IconButton key={cat.id} variant="ghost" label={cat.label} onClick={() => onJump(cat.id)}>
          <Box tag="span" style={{ lineHeight: 0 }}>
            <FaSvg icon={cat.icons[0]} size={14} />
          </Box>
        </IconButton>
      ))}
    </Flex>
  </>
);

const PickerBody = ({ loading, query, results, displayCategories, value, onSelect, scroll, t }) => {
  if (loading) {
    return (
      <Flex justifyContent="center" padding={6}>
        <Loader small>{t('input.loading', 'Loading…')}</Loader>
      </Flex>
    );
  }
  if (query) {
    return results.length ? (
      <IconGrid icons={results} value={value} onSelect={onSelect} />
    ) : (
      <Flex justifyContent="center" padding={6}>
        <Typography variant="pi" textColor="neutral500">
          {t('input.empty', 'No icons found')}
        </Typography>
      </Flex>
    );
  }
  return displayCategories.map((cat) => (
    <Box
      key={cat.id}
      paddingBottom={3}
      ref={(el) => {
        scroll.sectionRefs.current[cat.id] = el;
      }}
    >
      <Box
        paddingTop={2}
        paddingBottom={2}
        background="neutral0"
        style={{ position: 'sticky', top: 0, zIndex: 1 }}
      >
        <Typography variant="sigma" textColor="neutral600">
          {cat.label}
        </Typography>
      </Box>
      <IconGrid icons={cat.icons} value={value} onSelect={onSelect} />
    </Box>
  ));
};

/**
 * The popover panel: search + package selectors, the scrollable icon body, the
 * emoji-style category nav, and the remove-selection action.
 */
const PickerContent = ({ selection, catalog, query, setQuery, value, onSelect, onRemove, scroll }) => {
  const t = useTranslate();
  const { displayCategories, results, loading } = catalog;

  return (
    <Flex direction="column" alignItems="stretch" width="360px">
      {/* Search + package header */}
      <Flex direction="column" alignItems="stretch" gap={2} padding={3} paddingBottom={2}>
        <Searchbar
          name="icon-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery('')}
          clearLabel={t('input.clear', 'Clear search')}
          placeholder={t('input.search', 'Search icons…')}
        >
          {t('input.search', 'Search icons…')}
        </Searchbar>
        <PackageSelectors selection={selection} />
      </Flex>
      <Divider />

      {/* Scrollable body */}
      <Box
        ref={scroll.scrollRef}
        paddingLeft={3}
        paddingRight={3}
        maxHeight="280px"
        overflow="auto"
      >
        <PickerBody
          loading={loading}
          query={query}
          results={results}
          displayCategories={displayCategories}
          value={value}
          onSelect={onSelect}
          scroll={scroll}
          t={t}
        />
      </Box>

      {!query && displayCategories.length > 0 ? (
        <CategoryNav categories={displayCategories} onJump={scroll.jumpToCategory} />
      ) : null}

      {value ? (
        <>
          <Divider />
          <Box padding={2}>
            <Button variant="danger-light" fullWidth onClick={onRemove}>
              {t('input.remove', 'Remove icon')}
            </Button>
          </Box>
        </>
      ) : null}
    </Flex>
  );
};

export default PickerContent;
