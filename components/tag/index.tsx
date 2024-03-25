import * as React from 'react';
import classNames from 'classnames';

import type { PresetColorType, PresetStatusColorType } from '../_util/colors';
import { isPresetColor, isPresetStatusColor } from '../_util/colors';
import useClosable, { pickClosable } from '../_util/hooks/useClosable';
import { replaceElement } from '../_util/reactNode';
import type { LiteralUnion } from '../_util/type';
import { devUseWarning } from '../_util/warning';
import Wave from '../_util/wave';
import { ConfigContext } from '../config-provider';
import CheckableTag from './CheckableTag';
import useStyle from './style';
import PresetCmp from './style/presetCmp';
import StatusCmp from './style/statusCmp';

export type { CheckableTagProps } from './CheckableTag';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  prefixCls?: string;
  className?: string;
  rootClassName?: string;
  color?: LiteralUnion<PresetColorType | PresetStatusColorType>;
  closable?: boolean | ({ closeIcon?: React.ReactNode } & React.AriaAttributes);
  /** Advised to use closeIcon instead. */
  closeIcon?: React.ReactNode;
  /** @deprecated `visible` will be removed in next major version. */
  visible?: boolean;
  onClose?: (e: React.MouseEvent<HTMLElement>) => void;
  style?: React.CSSProperties;
  icon?: React.ReactNode;
  bordered?: boolean;
}

export interface TagType
  extends React.ForwardRefExoticComponent<TagProps & React.RefAttributes<HTMLElement>> {
  CheckableTag: typeof CheckableTag;
}

const InternalTag: React.ForwardRefRenderFunction<HTMLSpanElement, TagProps> = (tagProps, ref) => {
  const {
    prefixCls: customizePrefixCls,
    className,
    rootClassName,
    style,
    children,
    icon,
    color,
    onClose,
    closeIcon,
    closable,
    bordered = true,
    ...props
  } = tagProps;
  const { getPrefixCls, direction, tag } = React.useContext(ConfigContext);
  const [visible, setVisible] = React.useState(true);

  // Warning for deprecated usage
  if (process.env.NODE_ENV !== 'production') {
    const warning = devUseWarning('Tag');

    warning.deprecated(!('visible' in props), 'visible', 'visible && <Tag />');
  }

  React.useEffect(() => {
    if ('visible' in props) {
      setVisible(props.visible!);
    }
  }, [props.visible]);

  const isPreset = isPresetColor(color);
  const isStatus = isPresetStatusColor(color);
  const isInternalColor = isPreset || isStatus;

  const tagStyle: React.CSSProperties = {
    backgroundColor: color && !isInternalColor ? color : undefined,
    ...tag?.style,
    ...style,
  };

  const prefixCls = getPrefixCls('tag', customizePrefixCls);
  const [wrapCSSVar, hashId, cssVarCls] = useStyle(prefixCls);
  // Style

  const tagClassName = classNames(
    prefixCls,
    tag?.className,
    {
      [`${prefixCls}-${color}`]: isInternalColor,
      [`${prefixCls}-has-color`]: color && !isInternalColor,
      [`${prefixCls}-hidden`]: !visible,
      [`${prefixCls}-rtl`]: direction === 'rtl',
      [`${prefixCls}-borderless`]: !bordered,
    },
    className,
    rootClassName,
    hashId,
    cssVarCls,
  );

  const handleCloseClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    onClose?.(e);

    if (e.defaultPrevented) {
      return;
    }
    setVisible(false);
  };

  const [, mergedCloseIcon] = useClosable({
    closable,
    closeIcon,
    customCloseIconRender: (iconNode: React.ReactNode) => {
      const replacement = (
        <span className={`${prefixCls}-close-icon`} onClick={handleCloseClick}>
          {iconNode}
        </span>
      );
      return replaceElement(iconNode, replacement, (originProps) => ({
        onClick: (e: React.MouseEvent<HTMLElement>) => {
          originProps?.onClick?.(e);
          handleCloseClick(e);
        },
        className: classNames(originProps?.className, `${prefixCls}-close-icon`),
      }));
    },
    defaultClosable: false,
    context: pickClosable(tag),
  });

  const isNeedWave =
    typeof props.onClick === 'function' ||
    (children && (children as React.ReactElement<any>).type === 'a');

  const iconNode: React.ReactNode = icon || null;

  const kids: React.ReactNode = iconNode ? (
    <>
      {iconNode}
      {children && <span>{children}</span>}
    </>
  ) : (
    children
  );

  const tagNode: React.ReactNode = (
    <span {...props} ref={ref} className={tagClassName} style={tagStyle}>
      {kids}
      {mergedCloseIcon}
      {isPreset && <PresetCmp key="preset" prefixCls={prefixCls} />}
      {isStatus && <StatusCmp key="status" prefixCls={prefixCls} />}
    </span>
  );

  return wrapCSSVar(isNeedWave ? <Wave component="Tag">{tagNode}</Wave> : tagNode);
};

const Tag = React.forwardRef<HTMLSpanElement, TagProps>(InternalTag) as TagType;

if (process.env.NODE_ENV !== 'production') {
  Tag.displayName = 'Tag';
}

Tag.CheckableTag = CheckableTag;

export default Tag;
